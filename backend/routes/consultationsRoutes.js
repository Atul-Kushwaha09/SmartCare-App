const express = require('express');
const router = express.Router();
const consultationsController = require('../controllers/consultationsController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/my', verifyToken, authorizeRoles('patient'), consultationsController.getMyPatientConsultations);
router.get('/doctor', verifyToken, authorizeRoles('doctor'), consultationsController.getDoctorConsultations);
router.post('/start/:appointmentId', verifyToken, authorizeRoles('doctor'), consultationsController.startConsultation);
router.post('/end/:consultationId', verifyToken, authorizeRoles('doctor'), consultationsController.endConsultation);
router.get('/appointment/:appointmentId', verifyToken, consultationsController.getConsultationByAppointmentId);
router.get('/:id', verifyToken, consultationsController.getConsultationById);

module.exports = router;
