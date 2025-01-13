const express = require('express');
const AdminController = require('../controllers/adminController');
const { check } = require('express-validator');
const authMiddleware = require('../../middleware/auth'); // JWT Authentication middleware

const router = express.Router();

// Public routes
router.post('/register', [
    check('adminName', 'Admin name is required').not().isEmpty(),
    check('adminEmail', 'Valid email is required').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
], AdminController.register);

router.post('/login', [
    check('adminEmail', 'Valid email is required').isEmail(),
    check('password', 'Password is required').exists()
], AdminController.login);

// Secured routes (Requires JWT)
router.get('/profile', authMiddleware, AdminController.getProfile);
router.put('/profile', authMiddleware, AdminController.updateAdmin);
router.delete('/profile', authMiddleware, AdminController.deleteAdmin);

module.exports = router;
