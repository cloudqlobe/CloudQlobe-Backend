const express = require('express');
const router = express.Router();
const customerController = require('../controllers/userController') 
const authController = require('../controllers/authController');

//auth section
router.post('/customer/forgot-password', authController.forgotPassword);
router.post('/customer/reset-password', authController.resetPassword);
router.post("/logout", authController.logout);

router.post('/customer', customerController.createCustomer);
router.get('/customers', customerController.getAllCustomers);
router.get('/customer/:id', customerController.getCustomer);
// New password routes
router.post('/verify-password', customerController.verifyCurrentPassword);
router.put('/:customerId/password', customerController.updatePassword);

router.put('/switchIps/:id', customerController.updateSwitchIps);
router.post('/login', customerController.CustomerLogin);

router.put('/myrate/:id', customerController.createMyRate);

router.post('/testrate', customerController.createTestRate);
router.get('/testrates', customerController.getAllTestRate); 

router.post('/troubleticket', customerController.createTroubleTicket);
router.get('/troubleticket', customerController.getAllTroubleTicket);

router.post('/enquiry', customerController.createCustomerEnquiry);
router.post('/didNumber', customerController.createCustomerDidNumber);
router.post('/free_test', customerController.createCustomerFreeTest);

module.exports = router;