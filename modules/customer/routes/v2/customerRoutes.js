const express = require('express');
const CustomerController = require('../controllers/customerController');
const { check } = require('express-validator');
const authMiddleware = require('../../../middleware/auth'); // JWT Authentication middleware

const router = express.Router();

// Public routes
router.post('/register', [
    check('companyName', 'Company name is required').not().isEmpty(),
    check('companyEmail', 'Valid company email is required').isEmail(),
    check('contactPerson', 'Contact person is required').not().isEmpty(),
    check('country', 'Country is required').not().isEmpty(),
    check('companyPhone', 'Company phone is required').not().isEmpty(),
    check('userFirstname', 'First name is required').not().isEmpty(),
    check('userLastname', 'Last name is required').not().isEmpty(),
    check('username', 'Username is required').not().isEmpty(),
    check('userEmail', 'User email is required').isEmail(),
    check('userMobile', 'User mobile number is required').not().isEmpty(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    
], CustomerController.register);

router.post('/login', [
    check('userEmail', 'Valid email is required').isEmail(),
    check('password', 'Password is required').exists()
], CustomerController.login);

// Secured routes (Requires JWT)
router.get('/profile',  CustomerController.getProfile);
router.get('/profileId', CustomerController.getProfileById);
router.put('/profile',  CustomerController.updateCustomer);
router.delete('/profile', CustomerController.deleteCustomer);
router.get('/getAll', CustomerController.getAllCustomers);
module.exports = router;
