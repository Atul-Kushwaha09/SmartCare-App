const express = require('express');
const router = express.Router();
const doctorsController = require('../controllers/doctorsController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, doctorsController.getDoctors);
router.get('/:id', verifyToken, doctorsController.getDoctorById);

module.exports = router;
