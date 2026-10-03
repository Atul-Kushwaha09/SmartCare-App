const express = require('express');
const router = express.Router();
const medicalRecordsController = require('../controllers/medicalRecordsController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// Medical Records
router.post('/', verifyToken, authorizeRoles('doctor'), medicalRecordsController.createMedicalRecord);
router.get('/my', verifyToken, authorizeRoles('patient'), medicalRecordsController.getMyMedicalRecords);
router.get('/patient/:patientId', verifyToken, authorizeRoles('doctor'), medicalRecordsController.getPatientMedicalRecords);

// Prescriptions
router.post('/prescriptions', verifyToken, authorizeRoles('doctor'), medicalRecordsController.createPrescription);
router.get('/prescriptions/my', verifyToken, authorizeRoles('patient'), medicalRecordsController.getMyPrescriptions);
router.get('/prescriptions/patient/:patientId', verifyToken, authorizeRoles('doctor'), medicalRecordsController.getPatientPrescriptions);

// Lab Reports
router.post('/lab-reports', verifyToken, authorizeRoles('doctor'), medicalRecordsController.createLabReport);
router.get('/lab-reports/my', verifyToken, authorizeRoles('patient'), medicalRecordsController.getMyLabReports);
router.get('/lab-reports/patient/:patientId', verifyToken, authorizeRoles('doctor'), medicalRecordsController.getPatientLabReports);

module.exports = router;
