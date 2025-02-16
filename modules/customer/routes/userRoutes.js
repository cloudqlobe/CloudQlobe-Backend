const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/userController') 

router.post('/customer', CustomerController.createCustomer);
router.get('/customer/:id', CustomerController.getCustomer);
router.put('/customer/:id', CustomerController.updateCustomer);

router.post('/login', CustomerController.CustomerLogin);

module.exports = router;