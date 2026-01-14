const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController') 
const authController = require('../controllers/authController') 

router.post('/login', authController.superAdminLogin);
router.post('/verify-token', authController.verifySuperAdminToken);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.get('/validate-reset-token', authController.validateResetToken);
router.post('/reset-password', authController.resetPassword);

router.put('/profile/:id', adminController.UpdateProfile);
router.put('/change-password/:id', adminController.ChangePassword);

router.post('/createAdmin', adminController.createAdmin);
router.get('/getAllAdmin', adminController.getAllAdmin);
router.put('/updateAdmin/:id', adminController.updateAdmin);
router.delete('/deleteAdmin/:id', adminController.deleteAdmin);
router.delete('/deleteCustomer/:id', adminController.deleteCustomer);

router.post('/transferCustomer', adminController.transferManager);
router.get('/manager-transfers', adminController.getManagerTransfers);

module.exports = router;