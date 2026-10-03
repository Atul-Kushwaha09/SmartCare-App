const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/my', verifyToken, authorizeRoles('patient'), queueController.getMyQueue);
router.get('/doctor', verifyToken, authorizeRoles('doctor'), queueController.getDoctorQueue);
router.post('/call', verifyToken, authorizeRoles('doctor'), queueController.callNextPatient);
router.post('/:id/complete', verifyToken, authorizeRoles('doctor'), queueController.completeToken);

module.exports = router;
