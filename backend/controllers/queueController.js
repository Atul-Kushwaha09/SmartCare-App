const db = require('../db');
const { logAction } = require('../utils/auditLogger');

exports.getMyQueue = (req, res) => {
  const patient_id = req.user.id;
  const today = new Date().toISOString().split('T')[0];

  // Find the patient's waiting or called token for today
  const myQueueQuery = `
    SELECT q.*, d_user.name as doctor_name
    FROM queue_tokens q
    JOIN users d_user ON q.doctor_id = d_user.id
    WHERE q.patient_id = ? AND q.queue_date = ? AND q.status IN ('waiting', 'called')
    LIMIT 1
  `;

  db.get(myQueueQuery, [patient_id, today], (err, myToken) => {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
    if (!myToken) return res.json({ success: true, active: false });

    // Find the currently called token for this doctor
    const currentTokenQuery = `
      SELECT token_number FROM queue_tokens 
      WHERE doctor_id = ? AND queue_date = ? AND status = 'called'
      LIMIT 1
    `;
    
    db.get(currentTokenQuery, [myToken.doctor_id, today], (err, currentToken) => {
      // Calculate patients ahead (waiting tokens with id < myToken.id)
      const aheadQuery = `
        SELECT COUNT(*) as count FROM queue_tokens 
        WHERE doctor_id = ? AND queue_date = ? AND status = 'waiting' AND id < ?
      `;
      
      db.get(aheadQuery, [myToken.doctor_id, today, myToken.id], (err, ahead) => {
        res.json({
          success: true,
          active: true,
          doctorName: myToken.doctor_name,
          date: myToken.queue_date,
          myToken: myToken.token_number,
          status: myToken.status,
          appointmentId: myToken.appointment_id,
          currentToken: currentToken ? currentToken.token_number : 'None',
          patientsAhead: ahead ? ahead.count : 0
        });
      });
    });
  });
};

exports.getDoctorQueue = (req, res) => {
  const doctor_id = req.user.id;
  const today = new Date().toISOString().split('T')[0];

  const query = `
    SELECT q.*, p_user.name as patient_name
    FROM queue_tokens q
    JOIN users p_user ON q.patient_id = p_user.id
    WHERE q.doctor_id = ? AND q.queue_date = ? AND q.status IN ('waiting', 'called')
    ORDER BY q.id ASC
  `;

  db.all(query, [doctor_id, today], (err, queue) => {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
    res.json({ success: true, queue });
  });
};

exports.callNextPatient = (req, res) => {
  const doctor_id = req.user.id;
  const today = new Date().toISOString().split('T')[0];

  // First, verify we don't already have a 'called' patient that isn't completed
  db.get(`SELECT id FROM queue_tokens WHERE doctor_id = ? AND queue_date = ? AND status = 'called'`, [doctor_id, today], (err, calledToken) => {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
    if (calledToken) {
      return res.status(400).json({ success: false, message: 'You already have a patient called. Please complete their session first.' });
    }

    // Find the next waiting patient
    db.get(`SELECT id FROM queue_tokens WHERE doctor_id = ? AND queue_date = ? AND status = 'waiting' ORDER BY id ASC LIMIT 1`, [doctor_id, today], (err, nextToken) => {
      if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
      if (!nextToken) return res.json({ success: true, message: 'Queue is empty. No patients waiting.' });

      db.run(`UPDATE queue_tokens SET status = 'called' WHERE id = ?`, [nextToken.id], function(err) {
        if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
        
        logAction(doctor_id, 'QUEUE_PATIENT_CALLED', nextToken.id, { role: 'doctor' });
        res.json({ success: true, message: 'Next patient called successfully' });
      });
    });
  });
};

exports.completeToken = (req, res) => {
  const doctor_id = req.user.id;
  const { id } = req.params;

  db.run(
    `UPDATE queue_tokens SET status = 'completed' WHERE id = ? AND doctor_id = ?`,
    [id, doctor_id],
    function(err) {
      if (err) return res.status(500).json({ success: false, message: 'Internal Server Error' });
      
      logAction(doctor_id, 'QUEUE_TOKEN_COMPLETED', id, { role: 'doctor' });
      
      // Also update the appointment status
      db.get(`SELECT appointment_id FROM queue_tokens WHERE id = ?`, [id], (err, row) => {
        if (row && row.appointment_id) {
          db.run(`UPDATE appointments SET status = 'completed' WHERE id = ?`, [row.appointment_id]);
        }
      });

      res.json({ success: true, message: 'Consultation completed' });
    }
  );
};
