const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController') 

router.post('/createAdmin', adminController.createAdmin);
router.get('/getAllAdmin', adminController.getAllAdmin);
router.put('/updateAdmin/:id', adminController.updateAdmin);
router.delete('/deleteAdmin/:id', adminController.deleteAdmin);
router.delete('/deleteCustomer/:id', adminController.deleteCustomer);

router.post('/login', adminController.superAdminLogin);
router.post('/verify-token', adminController.verifySuperAdminToken);
router.post('/transferCustomer', adminController.transferManager);
router.get('/manager-transfers', adminController.getManagerTransfers);

module.exports = router;