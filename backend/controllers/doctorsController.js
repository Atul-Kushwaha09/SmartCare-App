const db = require('../db');

exports.getDoctors = (req, res) => {
  const query = `
    SELECT u.id, u.name, d.specialization, d.qualification, d.experience, d.availability
    FROM users u
    JOIN doctors d ON u.id = d.user_id
    WHERE u.role = 'doctor'
  `;
  
  db.all(query, [], (err, doctors) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, doctors });
  });
};

exports.getDoctorById = (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT u.id, u.name, d.specialization, d.qualification, d.experience, d.availability
    FROM users u
    JOIN doctors d ON u.id = d.user_id
    WHERE u.role = 'doctor' AND u.id = ?
  `;
  
  db.get(query, [id], (err, doctor) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, doctor });
  });
};
