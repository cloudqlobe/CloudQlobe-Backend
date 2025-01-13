const express = require('express');
const router = express.Router();
const CartItemController = require('../controllers/cartItemController'); // Import the controller


router.get('/cartitems', CartItemController.getAllCartItems);
router.get('/cartitems/customer/:customerId', CartItemController.getCartItemsByCustomerId);
router.get('/cartitems/:id', CartItemController.getCartItemById);
router.put('/cartitems/customer/:customerId', CartItemController.updateCartItemByCustomerId);

module.exports = router;
