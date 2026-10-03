const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/patient-only', verifyToken, authorizeRoles('patient'), (req, res) => {
  res.json({ success: true, message: 'Welcome to the patient dashboard data' });
});

router.get('/doctor-only', verifyToken, authorizeRoles('doctor'), (req, res) => {
  res.json({ success: true, message: 'Welcome to the doctor dashboard data' });
});

router.get('/admin-only', verifyToken, authorizeRoles('admin'), (req, res) => {
  res.json({ success: true, message: 'Welcome to the admin dashboard data' });
});

module.exports = router;
