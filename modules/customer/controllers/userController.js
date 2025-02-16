const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../../config/db');
const saltRounds = 10;

exports.createCustomer = async (req, res) => {
  const { companyName, companyEmail, companyWebsite, username, userEmail, password, switchIps } = req.body;
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
    function generateCustomerId(companyName) {
      // Take the first 4 letters of the companyName (or all if less than 4), convert to uppercase
      const namePart = companyName.slice(0, 4).toUpperCase();
      // Generate a random 4-digit number
      const numberPart = Math.floor(1000 + Math.random() * 9000);
      // Combine and return the customerId
      return `${namePart}${numberPart}`;
  }
 const customerId = generateCustomerId(companyName)
    // Set default values if not provided
    const newCustomerData = {
      ...req.body,
      customerId:customerId,
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


exports.getCustomer = (req, res) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: "Customer ID is required" });
  }

  const query = "SELECT * FROM customer WHERE id = ?";

  pool.query(query, [id], (err, results) => {
    if (err) {
      console.error("Error fetching customer data:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.status(200).json({ customer: results[0] });
  });
};


exports.updateCustomer = (req, res) => {
  const { id } = req.params;
  const { switchIps } = req.body;

  // Validate input
  if (!id || !switchIps || !Array.isArray(switchIps)) {
    return res.status(400).json({ error: "Customer ID and switchIps (array) are required" });
  }

  const switchIpsString = JSON.stringify(switchIps); // Convert array to JSON string

  const query = "UPDATE customer SET switchIps = ? WHERE id = ?";

  pool.query(query, [switchIpsString, id], (err, results) => {
    if (err) {
      console.error("Error updating customer:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Customer not found or no changes made" });
    }

    res.status(200).json({ message: "Customer updated successfully" });
  });
};

