const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');
const vendorController = require('../controller/vendorController');

//auth section
router.post('/create', authController.createVendor);
router.post('/login', authController.VendorLogin);
router.post('/verify-token', authController.VerifyToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/resend-token', authController.ResendToken);
router.get('/validate-reset-token', authController.validateResetToken);
router.post("/logout", authController.logout);


router.get('/vendorData/:id', vendorController.getVendor);
 
module.exports = router;