const db = require('../db');

// PATIENT ENDPOINTS

exports.getActiveLabTests = (req, res) => {
  const query = `SELECT * FROM lab_tests WHERE is_active = 1`;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
    res.json({ success: true, tests: rows });
  });
};

exports.bookLabTest = (req, res) => {
  const patient_id = req.user.id;
  const { lab_test_id, booking_date, booking_time } = req.body;

  if (!lab_test_id || !booking_date || !booking_time) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  // Check if test exists and is active
  db.get(`SELECT id FROM lab_tests WHERE id = ? AND is_active = 1`, [lab_test_id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Lab test not found or inactive' });

    const query = `INSERT INTO lab_bookings (patient_id, lab_test_id, booking_date, booking_time) VALUES (?, ?, ?, ?)`;
    db.run(query, [patient_id, lab_test_id, booking_date, booking_time], function(err) {
      if (err) return res.status(500).json({ success: false, message: 'Failed to book test', error: err.message });
      res.status(201).json({ success: true, message: 'Lab test booked successfully', booking_id: this.lastID });
    });
  });
};

exports.getMyLabBookings = (req, res) => {
  const patient_id = req.user.id;
  const query = `
    SELECT lb.*, lt.name as test_name, lt.price 
    FROM lab_bookings lb 
    JOIN lab_tests lt ON lb.lab_test_id = lt.id 
    WHERE lb.patient_id = ? 
    ORDER BY lb.booking_date DESC, lb.booking_time DESC
  `;
  db.all(query, [patient_id], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
    res.json({ success: true, bookings: rows });
  });
};

exports.getMyLabBookingById = (req, res) => {
  const patient_id = req.user.id;
  const { id } = req.params;

  const query = `
    SELECT lb.*, lt.name as test_name 
    FROM lab_bookings lb 
    JOIN lab_tests lt ON lb.lab_test_id = lt.id 
    WHERE lb.id = ?
  `;
  db.get(query, [id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (row.patient_id !== patient_id) return res.status(403).json({ success: false, message: 'Unauthorized to view this booking' });
    
    res.json({ success: true, booking: row });
  });
};

exports.getMyLabResults = (req, res) => {
  const patient_id = req.user.id;
  const query = `
    SELECT lr.*, lt.name as test_name 
    FROM lab_results lr 
    JOIN lab_tests lt ON lr.lab_test_id = lt.id 
    WHERE lr.patient_id = ?
    ORDER BY lr.report_date DESC
  `;
  db.all(query, [patient_id], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
    res.json({ success: true, results: rows });
  });
};

exports.getMyLabResultById = (req, res) => {
  const patient_id = req.user.id;
  const { id } = req.params;

  const query = `
    SELECT lr.*, lt.name as test_name 
    FROM lab_results lr 
    JOIN lab_tests lt ON lr.lab_test_id = lt.id 
    WHERE lr.id = ?
  `;
  db.get(query, [id], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
    if (!row) return res.status(404).json({ success: false, message: 'Result not found' });
    if (row.patient_id !== patient_id) return res.status(403).json({ success: false, message: 'Unauthorized to view this result' });
    
    res.json({ success: true, result: row });
  });
};

// ADMIN ENDPOINTS

exports.getAllLabTests = (req, res) => {
  db.all(`SELECT * FROM lab_tests`, [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
    res.json({ success: true, tests: rows });
  });
};

exports.createLabTest = (req, res) => {
  const { name, description, price, duration_minutes } = req.body;
  if (!name || !price || !duration_minutes) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const query = `INSERT INTO lab_tests (name, description, price, duration_minutes) VALUES (?, ?, ?, ?)`;
  db.run(query, [name, description, price, duration_minutes], function(err) {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
    res.status(201).json({ success: true, message: 'Lab test created', test_id: this.lastID });
  });
};

exports.updateLabTest = (req, res) => {
  const { id } = req.params;
  const { name, description, price, duration_minutes, is_active } = req.body;

  const query = `UPDATE lab_tests SET name = ?, description = ?, price = ?, duration_minutes = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  db.run(query, [name, description, price, duration_minutes, is_active ? 1 : 0, id], function(err) {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
    if (this.changes === 0) return res.status(404).json({ success: false, message: 'Lab test not found' });
    res.json({ success: true, message: 'Lab test updated successfully' });
  });
};

exports.deleteLabTest = (req, res) => {
  const { id } = req.params;
  const query = `UPDATE lab_tests SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  db.run(query, [id], function(err) {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
    if (this.changes === 0) return res.status(404).json({ success: false, message: 'Lab test not found' });
    res.json({ success: true, message: 'Lab test deactivated successfully' });
  });
};

exports.getAllLabBookings = (req, res) => {
  const query = `
    SELECT lb.*, u.name as patient_name, lt.name as test_name 
    FROM lab_bookings lb 
    JOIN users u ON lb.patient_id = u.id 
    JOIN lab_tests lt ON lb.lab_test_id = lt.id 
    ORDER BY lb.created_at DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
    res.json({ success: true, bookings: rows });
  });
};

exports.updateLabBookingStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ['booked', 'confirmed', 'completed', 'cancelled'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  const query = `UPDATE lab_bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  db.run(query, [status, id], function(err) {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
    if (this.changes === 0) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, message: 'Booking status updated successfully' });
  });
};

exports.createLabResult = (req, res) => {
  const { booking_id, result_summary, report_date } = req.body;

  if (!booking_id || !result_summary || !report_date) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  // Verify booking exists, is completed, and we get patient_id and lab_test_id
  db.get(`SELECT * FROM lab_bookings WHERE id = ?`, [booking_id], (err, booking) => {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Booking must be completed before adding results' });
    }

    const query = `INSERT INTO lab_results (booking_id, patient_id, lab_test_id, result_summary, report_date) VALUES (?, ?, ?, ?, ?)`;
    db.run(query, [booking.id, booking.patient_id, booking.lab_test_id, result_summary, report_date], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ success: false, message: 'A result for this booking already exists' });
        }
        return res.status(500).json({ success: false, message: 'Failed to create result', error: err.message });
      }
      res.status(201).json({ success: true, message: 'Lab result created successfully', result_id: this.lastID });
    });
  });
};

exports.getAllLabResults = (req, res) => {
  const query = `
    SELECT lr.*, u.name as patient_name, lt.name as test_name 
    FROM lab_results lr 
    JOIN users u ON lr.patient_id = u.id 
    JOIN lab_tests lt ON lr.lab_test_id = lt.id 
    ORDER BY lr.created_at DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
    res.json({ success: true, results: rows });
  });
};
