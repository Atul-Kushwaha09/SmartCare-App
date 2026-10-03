const db = require('../db');
const auditLogger = require('../utils/auditLogger');

exports.startConsultation = (req, res) => {
  const doctor_id = req.user.id;
  const { appointmentId } = req.params;

  // Verify the appointment exists and the doctor is authorized for it
  db.get(`SELECT * FROM appointments WHERE id = ?`, [appointmentId], (err, appointment) => {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    if (appointment.doctor_id !== doctor_id) return res.status(403).json({ success: false, message: 'Unauthorized: Not your appointment' });
    if (appointment.status !== 'confirmed') return res.status(400).json({ success: false, message: 'Appointment is not confirmed' });

    // Check if consultation already exists
    db.get(`SELECT * FROM consultations WHERE appointment_id = ?`, [appointmentId], (err, existing) => {
      if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
      
      const started_at = new Date().toISOString();
      
      if (existing) {
        // Update to active if not already completed/cancelled
        if (existing.status !== 'active' && existing.status !== 'completed' && existing.status !== 'cancelled') {
           db.run(`UPDATE consultations SET status = 'active', started_at = ? WHERE id = ?`, [started_at, existing.id]);
           existing.status = 'active';
           existing.started_at = started_at;
           auditLogger.logAction(doctor_id, 'CONSULTATION_RESUME', existing.id, { patient_id: appointment.patient_id, role: 'doctor' });
        }
        return res.json({ success: true, consultation: existing });
      }

      // Create new consultation
      db.run(
        `INSERT INTO consultations (appointment_id, patient_id, doctor_id, status, started_at) VALUES (?, ?, ?, 'active', ?)`,
        [appointmentId, appointment.patient_id, appointment.doctor_id, started_at],
        function(err) {
          if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
          const newId = this.lastID;
          auditLogger.logAction(doctor_id, 'CONSULTATION_START', newId, { appointment_id: appointmentId, patient_id: appointment.patient_id, role: 'doctor' });
          db.get(`SELECT * FROM consultations WHERE id = ?`, [newId], (err, consultation) => {
             res.status(201).json({ success: true, consultation });
          });
        }
      );
    });
  });
};

exports.endConsultation = (req, res) => {
  const doctor_id = req.user.id;
  const { consultationId } = req.params;

  db.get(`SELECT * FROM consultations WHERE id = ?`, [consultationId], (err, consultation) => {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
    if (!consultation) return res.status(404).json({ success: false, message: 'Consultation not found' });
    if (consultation.doctor_id !== doctor_id) return res.status(403).json({ success: false, message: 'Unauthorized: Not your consultation' });
    
    if (consultation.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Consultation already completed' });
    }

    const ended_at = new Date().toISOString();
    db.run(
      `UPDATE consultations SET status = 'completed', ended_at = ? WHERE id = ?`,
      [ended_at, consultationId],
      function(err) {
        if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
        auditLogger.logAction(doctor_id, 'CONSULTATION_END', consultationId, { patient_id: consultation.patient_id, role: 'doctor' });
        res.json({ success: true, message: `Consultation ended successfully` });
      }
    );
  });
};

exports.getMyPatientConsultations = (req, res) => {
  const patient_id = req.user.id;
  db.all(
    `SELECT c.*, d.name as doctor_name 
     FROM consultations c 
     JOIN users d ON c.doctor_id = d.id 
     WHERE c.patient_id = ? 
     ORDER BY c.created_at DESC`,
    [patient_id],
    (err, consultations) => {
      if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
      res.json({ success: true, consultations });
    }
  );
};

exports.getDoctorConsultations = (req, res) => {
  const doctor_id = req.user.id;
  db.all(
    `SELECT c.*, p.name as patient_name 
     FROM consultations c 
     JOIN users p ON c.patient_id = p.id 
     WHERE c.doctor_id = ? 
     ORDER BY c.created_at DESC`,
    [doctor_id],
    (err, consultations) => {
      if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
      res.json({ success: true, consultations });
    }
  );
};

exports.getConsultationById = (req, res) => {
  const user_id = req.user.id;
  const { id } = req.params;

  db.get(`SELECT c.*, p.name as patient_name, d.name as doctor_name
          FROM consultations c 
          JOIN users p ON c.patient_id = p.id
          JOIN users d ON c.doctor_id = d.id
          WHERE c.id = ?`, [id], (err, consultation) => {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
    if (!consultation) return res.status(404).json({ success: false, message: 'Consultation not found' });

    if (consultation.patient_id !== user_id && consultation.doctor_id !== user_id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.json({ success: true, consultation });
  });
};

exports.getConsultationByAppointmentId = (req, res) => {
  const user_id = req.user.id;
  const { appointmentId } = req.params;

  db.get(`SELECT c.*, p.name as patient_name, d.name as doctor_name
          FROM consultations c 
          JOIN users p ON c.patient_id = p.id
          JOIN users d ON c.doctor_id = d.id
          WHERE c.appointment_id = ?`, [appointmentId], (err, consultation) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    if (!consultation) return res.status(404).json({ success: false, message: 'Consultation not found. The doctor has not started it yet.' });

    if (consultation.patient_id !== user_id && consultation.doctor_id !== user_id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.json({ success: true, consultation });
  });
};
