const db = require('../db');
const { logAction } = require('../utils/auditLogger');

exports.createAppointment = (req, res) => {
  const patient_id = req.user.id;
  const { doctor_id, appointment_date, appointment_time, reason } = req.body;

  if (!doctor_id || !appointment_date || !appointment_time) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  // Prevent double booking
  db.get(
    `SELECT * FROM appointments 
     WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? 
     AND status IN ('pending', 'confirmed')`,
    [doctor_id, appointment_date, appointment_time],
    (err, row) => {
      if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
      if (row) return res.status(409).json({ success: false, message: 'Selected appointment slot is no longer available.' });

      db.run(
        `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason) 
         VALUES (?, ?, ?, ?, ?)`,
        [patient_id, doctor_id, appointment_date, appointment_time, reason || ''],
        function(err) {
          if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
          
          logAction(patient_id, 'APPOINTMENT_CREATED', this.lastID, { doctor_id, date: appointment_date });
          res.status(201).json({ success: true, message: 'Appointment booked successfully', id: this.lastID });
        }
      );
    }
  );
};

exports.getMyPatientAppointments = (req, res) => {
  const patient_id = req.user.id;
  const query = `
    SELECT a.*, d_user.name as doctor_name, d.specialization, q.token_number
    FROM appointments a
    JOIN users d_user ON a.doctor_id = d_user.id
    JOIN doctors d ON d_user.id = d.user_id
    LEFT JOIN queue_tokens q ON a.id = q.appointment_id
    WHERE a.patient_id = ?
    ORDER BY a.appointment_date DESC, a.appointment_time DESC
  `;
  db.all(query, [patient_id], (err, appointments) => {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
    res.json({ success: true, appointments });
  });
};

exports.cancelMyAppointment = (req, res) => {
  const patient_id = req.user.id;
  const { id } = req.params;

  db.run(
    `UPDATE appointments SET status = 'cancelled' 
     WHERE id = ? AND patient_id = ? AND status IN ('pending', 'confirmed')`,
    [id, patient_id],
    function(err) {
      if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
      if (this.changes === 0) return res.status(404).json({ success: false, message: 'Appointment not found or cannot be cancelled' });
      
      // Cancel associated queue token if any
      db.run(`UPDATE queue_tokens SET status = 'cancelled' WHERE appointment_id = ?`, [id]);
      
      logAction(patient_id, 'APPOINTMENT_CANCELLED', id, { role: 'patient' });
      res.json({ success: true, message: 'Appointment cancelled successfully' });
    }
  );
};

exports.confirmMyAppointment = (req, res) => {
  const patient_id = req.user.id;
  const { id } = req.params;

  db.get(`SELECT * FROM appointments WHERE id = ? AND patient_id = ?`, [id, patient_id], (err, appointment) => {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });

    db.run(
      `UPDATE appointments SET status = 'confirmed' WHERE id = ? AND patient_id = ?`,
      [id, patient_id],
      function(err) {
        if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
        
        logAction(patient_id, 'APPOINTMENT_CONFIRMED', id, { role: 'patient' });
        generateQueueToken(id, appointment.doctor_id, patient_id, appointment.appointment_date, res);
      }
    );
  });
};

exports.getDoctorAppointments = (req, res) => {
  const doctor_id = req.user.id;
  const query = `
    SELECT a.*, p_user.name as patient_name
    FROM appointments a
    JOIN users p_user ON a.patient_id = p_user.id
    WHERE a.doctor_id = ?
    ORDER BY a.appointment_date ASC, a.appointment_time ASC
  `;
  db.all(query, [doctor_id], (err, appointments) => {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
    res.json({ success: true, appointments });
  });
};

exports.updateAppointmentStatus = (req, res) => {
  const doctor_id = req.user.id;
  const { id } = req.params;
  const { status } = req.body;

  if (!['confirmed', 'cancelled', 'completed'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  db.get(`SELECT * FROM appointments WHERE id = ? AND doctor_id = ?`, [id, doctor_id], (err, appointment) => {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found or unauthorized' });

    db.run(
      `UPDATE appointments SET status = ? WHERE id = ? AND doctor_id = ?`,
      [status, id, doctor_id],
      function(err) {
        if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });

        logAction(doctor_id, `APPOINTMENT_${status.toUpperCase()}`, id, { role: 'doctor' });

        if (status === 'confirmed') {
          // Generate Queue Token
          generateQueueToken(id, doctor_id, appointment.patient_id, appointment.appointment_date, res);
        } else if (status === 'cancelled') {
          // Cancel queue token
          db.run(`UPDATE queue_tokens SET status = 'cancelled' WHERE appointment_id = ?`, [id]);
          res.json({ success: true, message: 'Appointment cancelled' });
        } else if (status === 'completed') {
          res.json({ success: true, message: 'Appointment completed' });
        }
      }
    );
  });
};

function generateQueueToken(appointment_id, doctor_id, patient_id, date, res) {
  // Count tokens for this doctor on this date to assign a sequential number
  db.get(
    `SELECT COUNT(*) as count FROM queue_tokens WHERE doctor_id = ? AND queue_date = ?`,
    [doctor_id, date],
    (err, row) => {
      if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
      
      const count = row.count + 1;
      const token_number = 'A' + String(count).padStart(3, '0');

      db.run(
        `INSERT INTO queue_tokens (appointment_id, doctor_id, patient_id, queue_date, token_number)
         VALUES (?, ?, ?, ?, ?)`,
        [appointment_id, doctor_id, patient_id, date, token_number],
        function(err) {
          if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
          
          // Create consultation record with status 'scheduled'
          db.get(`SELECT id FROM consultations WHERE appointment_id = ?`, [appointment_id], (err, existing) => {
            if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
            if (!existing) {
              db.run(
                `INSERT INTO consultations (appointment_id, patient_id, doctor_id, status) VALUES (?, ?, ?, 'waiting')`,
                [appointment_id, patient_id, doctor_id],
                function(err) {
                  if (err) {
                    console.error("Consultation create error:", err);
                    return res.status(500).json({ success: false, message: 'Internal Server Error' });
                  }
                  res.json({ success: true, message: 'Appointment confirmed, token generated, and consultation scheduled', token_number });
                }
              );
            } else {
              res.json({ success: true, message: 'Appointment confirmed and token generated', token_number });
            }
          });
        }
      );
    }
  );
}
