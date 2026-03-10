const express = require('express');
const router = express.Router();
const customerController = require('../controllers/userController') 
const authController = require('../controllers/authController');
const { guestLogin, createGuestAccount, listGuests, updateGuest, toggleGuestStatus } = require('../controllers/guestauthController');

//auth section
router.post('/login', authController.CustomerLogin);
router.post('/verify-token', authController.VerifyToken);
router.post('/resend-token', authController.ResendToken);
router.post('/forgot-password', authController.forgotPassword);
router.get('/validate-reset-token', authController.validateResetToken);
router.post('/reset-password', authController.resetPassword);
router.post("/logout", authController.logout);

//Guest Auth
router.post("/guest/create", createGuestAccount);
router.post("/guest/login", guestLogin);
router.get("/guests", listGuests);
router.put("/guest/:id", updateGuest);
router.put("/guest/:id/status", toggleGuestStatus);

//Customer
router.post('/customer', customerController.createCustomer);
router.get('/customers', customerController.getAllCustomers);
router.get('/customer/:id', customerController.getCustomer);
// New password routes
router.post('/verify-password', customerController.verifyCurrentPassword);
router.put('/:customerId/password', customerController.updatePassword);

router.put('/switchIps/:id', customerController.updateSwitchIps);

router.put('/myrate/:id', customerController.createMyRate);

router.post('/testrate', customerController.createTestRate);
router.get('/testrates', customerController.getAllTestRate); 

router.post('/troubleticket', customerController.createTroubleTicket);
router.get('/troubleticket', customerController.getAllTroubleTicket);
router.get('/troubleticket/:id', customerController.getTroubleTicket);

router.post('/enquiry', customerController.createCustomerEnquiry);
router.post('/didNumber', customerController.createCustomerDidNumber);
router.post('/free_test', customerController.createCustomerFreeTest);

module.exports = router;