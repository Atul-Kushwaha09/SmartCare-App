const jwt = require('jsonwebtoken');
const db = require('./db');

module.exports = (io) => {
  // Authentication middleware for socket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error: No token'));
    
    jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey', (err, decoded) => {
      if (err) return next(new Error('Authentication error: Invalid token'));
      socket.user = decoded; // { id, role }
      next();
    });
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id} (${socket.user.role})`);

    socket.on('join_consultation', (consultationId) => {
      // Verify authorization before joining
      db.get(`SELECT * FROM consultations WHERE id = ?`, [consultationId], (err, consultation) => {
        if (err || !consultation) {
          return socket.emit('error', 'Consultation not found');
        }

        const isPatient = socket.user.role === 'patient' && consultation.patient_id === socket.user.id;
        const isDoctor = socket.user.role === 'doctor' && consultation.doctor_id === socket.user.id;

        if (!isPatient && !isDoctor) {
          return socket.emit('error', 'Unauthorized to join this consultation');
        }

        const roomName = `consultation_${consultationId}`;
        socket.join(roomName);
        console.log(`User ${socket.user.id} joined ${roomName}`);

        // Fetch previous messages and send them to the user
        db.all(`SELECT m.*, u.name as sender_name 
                FROM consultation_messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.consultation_id = ? 
                ORDER BY m.created_at ASC`, [consultationId], (err, messages) => {
          if (!err && messages) {
            socket.emit('previous_messages', messages);
          }
        });
      });
    });

    socket.on('send_message', (data) => {
      const { consultationId, message } = data;
      
      // Basic verification again to be safe
      db.get(`SELECT * FROM consultations WHERE id = ? AND (patient_id = ? OR doctor_id = ?)`, 
        [consultationId, socket.user.id, socket.user.id], 
        (err, consultation) => {
          if (err || !consultation) return;

          // Save message
          db.run(`INSERT INTO consultation_messages (consultation_id, sender_id, sender_role, message) VALUES (?, ?, ?, ?)`,
            [consultationId, socket.user.id, socket.user.role, message],
            function(err) {
              if (err) {
                console.error('Failed to save message:', err);
                return;
              }
              
              const roomName = `consultation_${consultationId}`;
              io.to(roomName).emit('receive_message', {
                id: this.lastID,
                consultation_id: consultationId,
                sender_id: socket.user.id,
                sender_role: socket.user.role,
                message: message,
                created_at: new Date().toISOString()
              });
            }
          );
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.id}`);
    });
  });
};
