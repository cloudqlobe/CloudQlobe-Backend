const Admin = require('../model/adminModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

// Admin Controller to handle CRUD operations and authentication
const AdminController = {
    // Admin Registration
    register: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { adminName, adminEmail, password } = req.body;

        try {
            // Check if admin already exists
            const existingAdmin = await Admin.findOne({ adminEmail });
            if (existingAdmin) {
                return res.status(400).json({ message: 'Admin with this email already exists' });
            }

            // Create new admin
            const newAdmin = new Admin({
                adminName,
                adminEmail,
                password  // Password will be hashed in the model
            });

            await newAdmin.save();
            res.status(201).json({ message: 'Admin registered successfully' });
        } catch (error) {
            console.error(error.message);
            res.status(500).json({ message: 'Server error' });
        }
    },

    // Admin Login
    login: async (req, res) => {
        const { adminEmail, password } = req.body;

        try {
            // Find admin by email
            const admin = await Admin.findOne({ adminEmail });
            if (!admin) {
                return res.status(404).json({ message: 'Admin not found' });
            }

            // Check password
            const isMatch = await bcrypt.compare(password, admin.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            // Generate JWT token
            const token = jwt.sign({ adminId: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.json({ token });
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    },

    // Get Admin Profile (Secured route)
    getProfile: async (req, res) => {
        try {
            const admin = await Admin.findById(req.adminId).select('-password'); // Exclude password
            res.json(admin);
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    },

    // Update Admin (Secured route)
    updateAdmin: async (req, res) => {
        try {
            const updates = req.body;
            const admin = await Admin.findByIdAndUpdate(req.adminId, updates, { new: true }).select('-password');
            res.json(admin);
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    },

    // Delete Admin (Secured route)
    deleteAdmin: async (req, res) => {
        try {
            await Admin.findByIdAndDelete(req.adminId);
            res.json({ message: 'Admin deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    }
};

module.exports = AdminController;
