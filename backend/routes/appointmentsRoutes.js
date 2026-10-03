const express = require('express');
const router = express.Router();
const appointmentsController = require('../controllers/appointmentsController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/', verifyToken, authorizeRoles('patient'), appointmentsController.createAppointment);
router.get('/my', verifyToken, authorizeRoles('patient'), appointmentsController.getMyPatientAppointments);
router.post('/:id/cancel', verifyToken, authorizeRoles('patient'), appointmentsController.cancelMyAppointment);
router.post('/:id/confirm', verifyToken, authorizeRoles('patient'), appointmentsController.confirmMyAppointment);

router.get('/doctor', verifyToken, authorizeRoles('doctor'), appointmentsController.getDoctorAppointments);
router.put('/:id/status', verifyToken, authorizeRoles('doctor'), appointmentsController.updateAppointmentStatus);

module.exports = router;
