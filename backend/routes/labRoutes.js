const express = require('express');
const router = express.Router();
const labController = require('../controllers/labController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// === PATIENT ROUTES ===
// Get active lab tests available for booking
router.get('/tests', verifyToken, authorizeRoles('patient'), labController.getActiveLabTests);

// Lab Bookings
router.post('/bookings', verifyToken, authorizeRoles('patient'), labController.bookLabTest);
router.get('/bookings/my', verifyToken, authorizeRoles('patient'), labController.getMyLabBookings);
router.get('/bookings/:id', verifyToken, authorizeRoles('patient'), labController.getMyLabBookingById);

// Lab Results
router.get('/results/my', verifyToken, authorizeRoles('patient'), labController.getMyLabResults);
router.get('/results/:id', verifyToken, authorizeRoles('patient'), labController.getMyLabResultById);


// === ADMIN ROUTES ===
// Note: We use a specific prefix or distinct paths to avoid matching /:id

// Lab Tests Management
router.get('/admin/tests', verifyToken, authorizeRoles('admin'), labController.getAllLabTests);
router.post('/admin/tests', verifyToken, authorizeRoles('admin'), labController.createLabTest);
router.put('/admin/tests/:id', verifyToken, authorizeRoles('admin'), labController.updateLabTest);
router.delete('/admin/tests/:id', verifyToken, authorizeRoles('admin'), labController.deleteLabTest);

// Lab Bookings Management
router.get('/admin/bookings', verifyToken, authorizeRoles('admin'), labController.getAllLabBookings);
router.put('/admin/bookings/:id/status', verifyToken, authorizeRoles('admin'), labController.updateLabBookingStatus);

// Lab Results Management
router.get('/admin/results', verifyToken, authorizeRoles('admin'), labController.getAllLabResults);
router.post('/admin/results', verifyToken, authorizeRoles('admin'), labController.createLabResult);

module.exports = router;
