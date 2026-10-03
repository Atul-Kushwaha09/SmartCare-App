const db = require('../db');
const auditLogger = require('../utils/auditLogger');

// --- MEDICAL RECORDS ---

exports.createMedicalRecord = (req, res) => {
  const doctor_id = req.user.id;
  const { patient_id, appointment_id, record_type, title, description } = req.body;

  if (!patient_id || !record_type || !title) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  // Ensure doctor has an appointment with the patient
  db.get(`SELECT id FROM appointments WHERE doctor_id = ? AND patient_id = ?`, 
    [doctor_id, patient_id], 
    (err, appointment) => {
      if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
      if (!appointment) return res.status(403).json({ success: false, message: 'Unauthorized: Doctor has no appointment with this patient' });

      db.run(
        `INSERT INTO medical_records (patient_id, doctor_id, appointment_id, record_type, title, description) VALUES (?, ?, ?, ?, ?, ?)`,
        [patient_id, doctor_id, appointment_id || null, record_type, title, description],
        function(err) {
          if (err) {
            console.error('Record creation error:', err);
            return res.status(500).json({ success: false, message: 'Failed to create medical record' });
          }
          const newId = this.lastID;
          auditLogger.logAction(doctor_id, 'RECORD_CREATE', newId, { patient_id: patient_id, record_type, role: 'doctor' });
          res.status(201).json({ success: true, message: 'Medical record created', id: newId });
        }
      );
  });
};

exports.getMyMedicalRecords = (req, res) => {
  const patient_id = req.user.id;
  
  db.all(
    `SELECT m.*, d.name as doctor_name
     FROM medical_records m
     JOIN users d ON m.doctor_id = d.id
     WHERE m.patient_id = ?
     ORDER BY m.created_at DESC`,
    [patient_id],
    (err, records) => {
      if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
      auditLogger.logAction(patient_id, 'RECORD_READ', null, { role: 'patient' });
      res.json({ success: true, records });
    }
  );
};

exports.getPatientMedicalRecords = (req, res) => {
  const doctor_id = req.user.id;
  const { patientId } = req.params;

  // Authorization: Check if doctor has an appointment with this patient
  db.get(`SELECT id FROM appointments WHERE doctor_id = ? AND patient_id = ? LIMIT 1`, 
    [doctor_id, patientId], 
    (err, appointment) => {
      if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
      if (!appointment) return res.status(403).json({ success: false, message: 'Unauthorized: No active relationship with this patient' });

      db.all(
        `SELECT m.*, d.name as doctor_name
         FROM medical_records m
         JOIN users d ON m.doctor_id = d.id
         WHERE m.patient_id = ?
         ORDER BY m.created_at DESC`,
        [patientId],
        (err, records) => {
          if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
          auditLogger.logAction(doctor_id, 'RECORD_READ', null, { patient_id: patientId, role: 'doctor' });
          res.json({ success: true, records });
        }
      );
  });
};


// --- PRESCRIPTIONS ---

exports.createPrescription = (req, res) => {
  const doctor_id = req.user.id;
  const { medical_record_id, patient_id, medicine_name, dosage, frequency, duration, instructions } = req.body;

  if (!medical_record_id || !patient_id || !medicine_name) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  // Ensure record belongs to this doctor and patient
  db.get(`SELECT id FROM medical_records WHERE id = ? AND doctor_id = ? AND patient_id = ?`, 
    [medical_record_id, doctor_id, patient_id], 
    (err, record) => {
      if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
      if (!record) return res.status(403).json({ success: false, message: 'Unauthorized or invalid medical record' });

      db.run(
        `INSERT INTO prescriptions (medical_record_id, patient_id, doctor_id, medicine_name, dosage, frequency, duration, instructions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [medical_record_id, patient_id, doctor_id, medicine_name, dosage, frequency, duration, instructions],
        function(err) {
          if (err) return res.status(500).json({ success: false, message: 'Failed to create prescription' });
          const newId = this.lastID;
          auditLogger.logAction(doctor_id, 'PRESCRIPTION_CREATE', newId, { patient_id: patient_id, role: 'doctor' });
          res.status(201).json({ success: true, message: 'Prescription created', id: newId });
        }
      );
  });
};

exports.getMyPrescriptions = (req, res) => {
  const patient_id = req.user.id;
  
  db.all(
    `SELECT p.*, d.name as doctor_name, m.title as record_title
     FROM prescriptions p
     JOIN users d ON p.doctor_id = d.id
     JOIN medical_records m ON p.medical_record_id = m.id
     WHERE p.patient_id = ?
     ORDER BY p.created_at DESC`,
    [patient_id],
    (err, prescriptions) => {
      if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
      auditLogger.logAction(patient_id, 'PRESCRIPTION_READ', null, { role: 'patient' });
      res.json({ success: true, prescriptions });
    }
  );
};

exports.getPatientPrescriptions = (req, res) => {
  const doctor_id = req.user.id;
  const { patientId } = req.params;

  db.get(`SELECT id FROM appointments WHERE doctor_id = ? AND patient_id = ? LIMIT 1`, 
    [doctor_id, patientId], 
    (err, appointment) => {
      if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
      if (!appointment) return res.status(403).json({ success: false, message: 'Unauthorized: No active relationship' });

      db.all(
        `SELECT p.*, d.name as doctor_name, m.title as record_title
         FROM prescriptions p
         JOIN users d ON p.doctor_id = d.id
         JOIN medical_records m ON p.medical_record_id = m.id
         WHERE p.patient_id = ?
         ORDER BY p.created_at DESC`,
        [patientId],
        (err, prescriptions) => {
          if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
          auditLogger.logAction(doctor_id, 'PRESCRIPTION_READ', null, { patient_id: patientId, role: 'doctor' });
          res.json({ success: true, prescriptions });
        }
      );
  });
};

// --- LAB REPORTS ---

exports.createLabReport = (req, res) => {
  const doctor_id = req.user.id; // We assume doctor uploads lab report results
  const { medical_record_id, patient_id, test_name, result_summary, report_date } = req.body;

  if (!medical_record_id || !patient_id || !test_name) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  // Ensure record belongs to this doctor and patient
  db.get(`SELECT id FROM medical_records WHERE id = ? AND doctor_id = ? AND patient_id = ?`, 
    [medical_record_id, doctor_id, patient_id], 
    (err, record) => {
      if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
      if (!record) return res.status(403).json({ success: false, message: 'Unauthorized or invalid medical record' });

      db.run(
        `INSERT INTO lab_reports (medical_record_id, patient_id, test_name, result_summary, report_date) VALUES (?, ?, ?, ?, ?)`,
        [medical_record_id, patient_id, test_name, result_summary, report_date],
        function(err) {
          if (err) return res.status(500).json({ success: false, message: 'Failed to create lab report' });
          const newId = this.lastID;
          auditLogger.logAction(doctor_id, 'LAB_REPORT_CREATE', newId, { patient_id: patient_id, role: 'doctor' });
          res.status(201).json({ success: true, message: 'Lab report created', id: newId });
        }
      );
  });
};

exports.getMyLabReports = (req, res) => {
  const patient_id = req.user.id;
  
  db.all(
    `SELECT l.*, m.title as record_title
     FROM lab_reports l
     JOIN medical_records m ON l.medical_record_id = m.id
     WHERE l.patient_id = ?
     ORDER BY l.created_at DESC`,
    [patient_id],
    (err, lab_reports) => {
      if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
      auditLogger.logAction(patient_id, 'LAB_REPORT_READ', null, { role: 'patient' });
      res.json({ success: true, lab_reports });
    }
  );
};

exports.getPatientLabReports = (req, res) => {
  const doctor_id = req.user.id;
  const { patientId } = req.params;

  db.get(`SELECT id FROM appointments WHERE doctor_id = ? AND patient_id = ? LIMIT 1`, 
    [doctor_id, patientId], 
    (err, appointment) => {
      if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
      if (!appointment) return res.status(403).json({ success: false, message: 'Unauthorized: No active relationship' });

      db.all(
        `SELECT l.*, m.title as record_title
         FROM lab_reports l
         JOIN medical_records m ON l.medical_record_id = m.id
         WHERE l.patient_id = ?
         ORDER BY l.created_at DESC`,
        [patientId],
        (err, lab_reports) => {
          if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
          auditLogger.logAction(doctor_id, 'LAB_REPORT_READ', null, { patient_id: patientId, role: 'doctor' });
          res.json({ success: true, lab_reports });
        }
      );
  });
};
