const Customer = require('../../model/v2/customerModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

// Customer Controller to handle CRUD operations and authentication
const CustomerController = {
    // Customer Registration
    register: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
            
        }

        const { companyName, companyEmail, contactPerson, country, companyPhone, address, companyWebsite, userFirstname, userLastname, username, userEmail, userMobile, password, supportEmail, sipSupport, codex, ipdbid, customerType } = req.body;
        
        try {
            // Check if customer already exists
            const existingCustomer = await Customer.findOne({ userEmail });
            if (existingCustomer) {
                return res.status(400).json({ message: 'Customer with this email already exists' });
            }

            // Create new customer
            const newCustomer = new Customer({
                companyName,
                companyEmail,
                contactPerson,
                country,
                companyPhone,
                address,
                companyWebsite,
                userFirstname,
                userLastname,
                username,
                userEmail,
                userMobile,
                password,  // Password will be hashed in the model
                supportEmail,
                sipSupport,
                codex,
                ipdbid:"id",
                customerType:"Lead",
                customerStatus: 'inactive',
                leadStatus: 'new',
                leadType: 'cold'
            });

            await newCustomer.save();
            res.status(201).json({ message: 'Customer registered successfully' });
        } catch (error) {
            console.error(error.message);
            res.status(500).json({ message: 'Server error' });
        }
    },

    // Customer Login
    login: async (req, res) => {
        const { username, password } = req.body;
        

        try {
            // Find customer by email
            const customer = await Customer.findOne({username: username });
            if (!customer) {
                return res.status(404).json({ message: 'Customer not found' });
            }

            // Check password
            const isMatch = await bcrypt.compare(password, customer.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            // Generate JWT token
            const token = jwt.sign({ customerId: customer._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.json({ token });
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    },

    // Get Customer Profile (Secured route)
// Backend: Get customer profile by customerId from query parameters
// Backend: Get customer profile by customerId from query parameters
getProfile: async (req, res) => {
    try {
        const { customerId } = req.query; // Get customerId from query parameters

        if (!customerId) {
            return res.status(400).json({ message: 'Customer ID is required' });
        }

        // Use findOne to locate the customer based on customerId
        const customer = await Customer.findOne({ customerId }).select('-password'); // Exclude password

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.json(customer);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
},

getProfileById: async (req, res) => {
    try {
        const { customerId } = req.query; // Get customerId from route parameters
        console.log(customerId+"mier");

        if (!customerId) {
            return res.status(400).json({ message: 'Customer ID is required' });
        }

        // Use findById to locate the customer based on the object ID
        const customer = await Customer.findById(customerId).select('-password'); // Exclude password

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.json(customer);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
},

// Update Customer (Secured route)
// Update Customer (Secured route)
updateCustomer: async (req, res) => {
    const { customerId } = req.query; // Assuming customerId is passed in the request body
    
    if (!customerId) {
        return res.status(400).json({ message: 'Customer ID is required' });
    }
    
    try {
        const updates = req.query;
        // Use findOneAndUpdate to find the customer by customerId
        const customer = await Customer.findOneAndUpdate(
            { customerId }, // Filter by customerId
            updates, // Updates to apply
            { new: true } // Return the updated document
        ).select('-password'); // Exclude the password field
        
        if (!customer) {
            console.log("not founf")
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.json(customer);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
},


    // Delete Customer (Secured route)
    deleteCustomer: async (req, res) => {
        try {
            await Customer.findByIdAndDelete(req.customerId);
            res.json({ message: 'Customer deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    },
    
    getAllCustomers: async (req, res) => {
    try {
        const customers = await Customer.find().select('-password'); // Exclude passwords from the response
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
},

};


// Get All Customers (Secured route)



module.exports = CustomerController;
