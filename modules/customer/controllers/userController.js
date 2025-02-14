const Customer = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../../config/db'); 
const saltRounds = 10;

exports.createCustomer = async (req, res) => {
  const { companyName, companyEmail, companyWebsite, username, userEmail, password, switchIps  } = req.body;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Check for duplicate records
  const duplicateCheckQuery = `
        SELECT * FROM customer 
        WHERE companyName = ? OR companyEmail = ? OR companyWebsite = ? OR username = ? OR userEmail = ?
    `;

  pool.query(duplicateCheckQuery, [companyName, companyEmail, companyWebsite, username, userEmail], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (results.length > 0) {
      const duplicateFields = [];
      results.forEach(customer => {
        if (customer.companyName === companyName) duplicateFields.push("companyName");
        if (customer.companyEmail === companyEmail) duplicateFields.push("companyEmail");
        if (customer.companyWebsite === companyWebsite) duplicateFields.push("companyWebsite");
        if (customer.username === username) duplicateFields.push("username");
        if (customer.userEmail === userEmail) duplicateFields.push("userEmail");
      });

      return res.status(400).json({
        error: "Duplicate data found",
        duplicateFields: duplicateFields,
      });
    }
    // Set default values if not provided
    const newCustomerData = {
      ...req.body,
      password: hashedPassword,
      switchIps: JSON.stringify(switchIps || []), // Ensure it's a valid JSON array
      ipdbid: req.body.ipdbid || "id",
      customerType: req.body.customerType || "Lead",
      customerStatus: req.body.customerStatus || "inactive",
      leadStatus: req.body.leadStatus || "new",
      leadType: req.body.leadType || "cold",
    };

    // Insert new customer into the database
    const insertQuery = "INSERT INTO customer SET ?";

    pool.query(insertQuery, newCustomerData, (err, results) => {
      if (err) {
        console.error("Insert error:", err);
        return res.status(500).send(err);
      }

      // Send welcome email after successful insertion
      // sendEmail(userEmail, userFirstname, results.insertId, password);
      // sendWelcomeEmail(userEmail, results.insertId);

      res.json({ message: "Customer added successfully", id: results.insertId });
    });
  });
};


exports.CustomerLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if customer exists in MySQL
    const query = "SELECT * FROM customer WHERE username = ?";
    
    pool.query(query, [username], async (err, results) => {
      
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "Customer not found" });
      }

      const customer = results[0];

      // Verify password
      const isMatch = await bcrypt.compare(password, customer.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Invalid password" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: customer.id, customerId: customer.customerId }, // Ensure your DB has `id` and `customerId` fields
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({ token });
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


exports.getAllCustomer = (req, res) => {
  Customer.getAllCustomer((err, results) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json({ results });
    }
  });
};

exports.updateCustomer = (req, res) => {
  const id = req.params.id;
  const data = req.body
  console.log(data);

  Customer.updateCustomer(id, data, (err, results) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(results[0] || {});
    }
  })
};


exports.deleteCustomer = (req, res) => {
  const id = req.params.id;
  console.log(id);

  Customer.deleteCustomer(id, (err, results) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(results[0] || {});
    }
  })
};

exports.customerLogin = (req, res) => {
  const customer = req.body;
  console.log(customer);

  Customer.createCustomer(customer, (err, results) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json({ message: 'Customer added successfully', id: results.insertId });
    }
  });
};