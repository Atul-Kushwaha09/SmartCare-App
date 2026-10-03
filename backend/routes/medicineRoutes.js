const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// --- PATIENT APIs --- (also accessible by admin/doctor if needed)
router.get('/medicines', verifyToken, medicineController.getMedicines);
router.get('/pharmacies', verifyToken, medicineController.getPharmacies);
router.get('/pharmacies/:id', verifyToken, medicineController.getPharmacyById);
router.get('/medicines/:id/availability', verifyToken, medicineController.getMedicineAvailability);

// --- ADMIN APIs ---
// Medicines
router.get('/admin/medicines', verifyToken, authorizeRoles('admin'), medicineController.adminGetMedicines);
router.post('/admin/medicines', verifyToken, authorizeRoles('admin'), medicineController.adminCreateMedicine);
router.put('/admin/medicines/:id', verifyToken, authorizeRoles('admin'), medicineController.adminUpdateMedicine);
router.delete('/admin/medicines/:id', verifyToken, authorizeRoles('admin'), medicineController.adminDeleteMedicine);

// Pharmacies
router.get('/admin/pharmacies', verifyToken, authorizeRoles('admin'), medicineController.adminGetPharmacies);
router.post('/admin/pharmacies', verifyToken, authorizeRoles('admin'), medicineController.adminCreatePharmacy);
router.put('/admin/pharmacies/:id', verifyToken, authorizeRoles('admin'), medicineController.adminUpdatePharmacy);
router.delete('/admin/pharmacies/:id', verifyToken, authorizeRoles('admin'), medicineController.adminDeletePharmacy);

// Inventory
router.get('/admin/inventory', verifyToken, authorizeRoles('admin'), medicineController.adminGetInventory);
router.post('/admin/inventory', verifyToken, authorizeRoles('admin'), medicineController.adminCreateInventory);
router.put('/admin/inventory/:id', verifyToken, authorizeRoles('admin'), medicineController.adminUpdateInventory);
router.delete('/admin/inventory/:id', verifyToken, authorizeRoles('admin'), medicineController.adminDeleteInventory);

module.exports = router;
