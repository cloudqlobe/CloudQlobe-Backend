const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/userController') 

router.post('/customer', CustomerController.createCustomer);
router.get('/customer', CustomerController.getAllCustomer);
router.put('/customer/:id', CustomerController.updateCustomer);
router.delete('/customer/:id', CustomerController.deleteCustomer);

router.post('/login', CustomerController.CustomerLogin);

module.exports = router;