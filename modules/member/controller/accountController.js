const pool = require('../../../config/db');
const bcrypt = require("bcryptjs");
const moment = require('moment');
const jwt = require("jsonwebtoken");
const saltRounds = 10;

exports.memberLogin = async (req, res) => {
  try {
    const { username, password, selectDepartment } = req.body;

    const [rows] = await pool.promise().query("SELECT * FROM accountmember WHERE email = ?", [username]);
    console.log(rows);

    if (rows.length === 0) {
      return res.status(404).json({ message: "AccountMember not found" });
    }

    const admin = rows[0];

    // Check if the department matches the role
    if (selectDepartment !== admin.role) {
      return res.status(404).json({ message: "AccountMember not found" });
    }

    // Compare passwords (Using bcrypt for security)
    const isPasswordMatch = await bcrypt.compare(password, admin.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Generate JWT token
        const token = jwt.sign({ id: admin.id, username: admin.email, role: admin.role, name: admin.fullName,  }, process.env.JWT_SECRET, { expiresIn: "24h" });
    console.log("Generated Token:", token);

    // Set the token in a cookie
    res.cookie("Token", token, {
      httpOnly: true,
      secure: false, // Set to `true` in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Admin Data Response
    const adminData = {
      username: admin.email,
      name: admin.fullName,
      role: admin.role,
      id: admin.id
    };

    return res.status(200).json({ message: "Login successful", adminData });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAccountMember = async (req, res) => {
  const { id } = req.params;
  console.log(id);

  const query = "SELECT * FROM accountmember WHERE id = ?";
  try {
    const [[results]] = await pool.promise().query(query, [id]);
    res.status(200).json({ member: results })
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


//Transation

exports.createTransaction = async (req, res) => {
  try {
    const { UserId, customerId, amount, dateAndTime, referenceNo, accountAgent, image, memberId } = req.body;
    console.log(req.body);

    // Validate that all fields are provided
    if (!UserId || !customerId || !amount || !dateAndTime || !referenceNo || !accountAgent || !memberId) {
      return res.status(400).json({
        success: false,
        message: "All fields must be filled",
      });
    }

    const parsedDate = moment.utc(dateAndTime, "MM/DD/YYYY, hh:mm A", true);

    if (!parsedDate.isValid()) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use MM/DD/YYYY, hh:mm A",
      });
    }

    const formattedDate = parsedDate.format("YYYY-MM-DD HH:mm:ss");

    const query = `
            INSERT INTO transactions 
            (UserId, memberId, amount, dateAndTime, customerId, referenceNo, accountAgent, image)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

    // Execute query
    const [result] = await pool.promise().query(query, [
      UserId,
      memberId,
      amount,
      formattedDate,
      customerId,
      referenceNo,
      accountAgent,
      image || null, // Handle potential undefined image
    ]);

    return res.status(201).json({
      success: true,
      message: "Recharge transaction added successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getAllTransactions = async (req, res) => {
  const query = "SELECT * FROM transactions";
  try {
    const [results] = await pool.promise().query(query);
    console.log(results);

    res.status(200).json({ success: true, transaction: results })
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getTransactions = async (req, res) => {
  const { id } = req.params;
  console.log("id", id);

  const query = "SELECT * FROM transactions WHERE UserId = ?";
  try {
    const [results] = await pool.promise().query(query, [id]);

    res.status(200).json({ success: true, transaction: results })
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getTransactionsByMemberId = async (req, res) => {
  const { id } = req.params;
  console.log("id", id);

  const query = "SELECT * FROM transactions WHERE memberId = ?";
  try {
    const [results] = await pool.promise().query(query, [id]);

    res.status(200).json({ success: true, transaction: results })
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateTransactionsServiceEngineer = async (req, res) => {
  const { id } = req.params;
  const { serviceEngineer } = req.body;
  console.log("updateEnquiry", id, serviceEngineer);

  const update = `UPDATE transactions SET serviceEngineer = ? WHERE _id = ?`
  try {
    await pool.promise().query(update, [serviceEngineer, id])
    res.json({ success: true, message: " pickup successfully." })

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateMemberTransactionsId = async (req, res) => {
  const { rechargeId } = req.body;
  const { id } = req.params;
  console.log(rechargeId, id, "updatetrsan");

  const fetchQuery = "SELECT recharge_ids FROM accountmember WHERE id = ?";
  const updateQuery = "UPDATE accountmember SET recharge_ids = ? WHERE id = ?";

  try {
    const [rows] = await pool.promise().query(fetchQuery, [id]);
    let existingRates = rows.length > 0 && rows[0].recharge_ids ? JSON.parse(rows[0].recharge_ids) : [];

    if (!Array.isArray(existingRates)) {
      existingRates = [];
    }

    // Append the new rate structure
    existingRates.push({ rechargeId });

    // Convert back to JSON and update the database
    await pool.promise().query(updateQuery, [JSON.stringify(existingRates), id]);

    console.log("Updated:", existingRates);
    res.json({ success: true, message: " pickup successfully." })
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateTransationStatus = async (req, res) => {
  const { id } = req.params;
  const { transactionStatus } = req.body;
  console.log(id, transactionStatus);

  const updateTest = `UPDATE transactions SET transactionStatus = ? WHERE _id = ?`
  try {
    const results = await pool.promise().query(updateTest, [transactionStatus, id])
    res.status(200).json()
    console.log(results);

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//Transation
//Vendor

exports.Vendorcreate = async (req, res) => {
  try {
    console.log("Received Vendor Data:", req.body);
    console.log("Received File:", req.file); // Check if file is received

    const {
      carrierId, accountManager, serviceCategory, carrierType,
      accountAssociate, paymentMethod, paymentAmount, priority,
      usdtLink, description, memberId
    } = req.body;

    // Get image path from uploaded file (multer stores it in `req.file`)
    const image = req.file ? req.file.path : null;

    // Validate required fields
    if ([carrierId, accountManager, serviceCategory, carrierType, accountAssociate,
      paymentMethod, paymentAmount, priority, description, memberId].includes(undefined) ||
      (paymentMethod === "USDT" && !usdtLink)) {
      return res.status(400).json({ success: false, message: "All required fields must be filled" });
    }

    const query = `
            INSERT INTO vendor 
            (carrierId, accountManager, serviceCategory, image, carrierType, 
            accountAssociate, paymentMethod, paymentAmount, priority, usdtLink, description, memberId) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
      carrierId, accountManager, serviceCategory, image, carrierType,
      accountAssociate, paymentMethod, paymentAmount, priority, usdtLink, description, memberId
    ];

    // Ensure pool.execute() is used correctly
    const [result] = await pool.promise().query(query, values);

    return res.status(201).json({
      success: true,
      message: "Vendor created successfully",
      data: { id: result.insertId, ...req.body, image },
    });

  } catch (error) {
    console.error("Vendor Creation Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getAllVendor = async (req, res) => {
  const query = "SELECT * FROM vendor";
  try {
    const [results] = await pool.promise().query(query);
    console.log(results);
    
    res.status(200).json({ success: true, vendor: results })
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getVendorByMemberId = async (req, res) => {
  const { id } = req.params;
  console.log("id", id);

  const query = "SELECT * FROM vendor WHERE memberId = ?";
  try {
    const [results] = await pool.promise().query(query, [id]);

    res.status(200).json({ success: true, vendor: results })
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateVendorServiceEngineer = async (req, res) => {
  const { id } = req.params;
  const { serviceEngineer } = req.body;
  console.log("updateEnquiry", id, serviceEngineer);

  const update = `UPDATE vendor SET serviceEngineer = ? WHERE id = ?`
  try {
    await pool.promise().query(update, [serviceEngineer, id])
    res.json({ success: true, message: " pickup successfully." })

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateMemberVendorsId = async (req, res) => {
  const { vendorId } = req.body;
  const { id } = req.params;
  console.log(vendorId, id, "updatetrsan");

  const fetchQuery = "SELECT vendor_ids FROM accountmember WHERE id = ?";
  const updateQuery = "UPDATE accountmember SET vendor_ids = ? WHERE id = ?";

  try {
    const [rows] = await pool.promise().query(fetchQuery, [id]);
    let existingRates = rows.length > 0 && rows[0].vendor_ids ? JSON.parse(rows[0].vendor_ids) : [];

    if (!Array.isArray(existingRates)) {
      existingRates = [];
    }

    // Append the new rate structure
    existingRates.push({ vendorId });

    // Convert back to JSON and update the database
    await pool.promise().query(updateQuery, [JSON.stringify(existingRates), id]);

    console.log("Updated:", existingRates);
    res.json({ success: true, message: " pickup successfully." })
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateVentorStatus = async (req, res) => {
  const { id } = req.params;
  const { transactionStatus } = req.body;
  console.log(id, transactionStatus);

  const updateTest = `UPDATE vendor SET status = ? WHERE id = ?`
  try {
    const results = await pool.promise().query(updateTest, [transactionStatus, id])
    res.status(200).json()
    console.log(results);

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateTestPrivateRateServiceEngineer = async (req, res) => {
  const { id } = req.params;
  const { account_associate } = req.body;
  console.log("updateEnquiry", id, account_associate);

  const update = `UPDATE test_private_rate SET account_associate = ? WHERE _id = ?`
  try {
    await pool.promise().query(update, [account_associate, id])
    res.json({ success: true, message: " pickup successfully." })

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateMemberPrivateRateId = async (req, res) => {
  const { privateRateId } = req.body;
  const { id } = req.params;
  console.log(privateRateId, id, "updatetrsan");

  const fetchQuery = "SELECT privateRateId FROM accountmember WHERE id = ?";
  const updateQuery = "UPDATE accountmember SET privateRateId = ? WHERE id = ?";

  try {
    const [rows] = await pool.promise().query(fetchQuery, [id]);
    let existingRates = rows.length > 0 && rows[0].privateRateId ? JSON.parse(rows[0].privateRateId) : [];

    if (!Array.isArray(existingRates)) {
      existingRates = [];
    }

    // Append the new rate structure
    existingRates.push({ privateRateId });

    // Convert back to JSON and update the database
    await pool.promise().query(updateQuery, [JSON.stringify(existingRates), id]);

    console.log("Updated:", existingRates);
    res.json({ success: true, message: " pickup successfully." })
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updatePrivateRateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const updateTest = `UPDATE test_private_rate SET status = ? WHERE _id = ?`
  try {
    const results = await pool.promise().query(updateTest, [status, id])
    res.status(200).json()
    console.log(results);

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createOverdraft = async (req, res) => {
  const overdraft = req.body;
  console.log(overdraft);

  const insertQuery = "INSERT INTO overdraft SET ?";
  try {
    const [results] = await pool.promise().query(insertQuery, [overdraft]);
    res.status(200).json({ overdraft: results })
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAllOverdraft = async (req, res) => {
  const query = "SELECT * FROM overdraft";
  try {
    const [results] = await pool.promise().query(query);
    res.status(200).json({ success: true, overdraft: results })
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateOverdraftServiceEngineer = async (req, res) => {
  const { id } = req.params;
  const { serviceEngineer } = req.body;
  console.log("updateserviceng", id, serviceEngineer);

  const update = `UPDATE overdraft SET serviceEngineer = ? WHERE _id = ?`
  try {
    await pool.promise().query(update, [serviceEngineer, id])
    res.json({ success: true, message: " pickup successfully." })

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateMemberOverdraftId = async (req, res) => {
  const { overdraftId } = req.body;
  const { id } = req.params;
  console.log("memberoverdraft", overdraftId, id);

  const fetchQuery = "SELECT overdraftId FROM accountmember WHERE id = ?";
  const updateQuery = "UPDATE accountmember SET overdraftId = ? WHERE id = ?";

  try {
    const [rows] = await pool.promise().query(fetchQuery, [id]);
    let existingRates = rows.length > 0 && rows[0].overdraftId ? JSON.parse(rows[0].overdraftId) : [];

    if (!Array.isArray(existingRates)) {
      existingRates = [];
    }

    // Append the new rate structure
    existingRates.push({ overdraftId });

    // Convert back to JSON and update the database
    await pool.promise().query(updateQuery, [JSON.stringify(existingRates), id]);

    console.log("Updated:", existingRates);
    res.json({ success: true, message: " pickup successfully." })
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateOverdraftStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const updateTest = `UPDATE overdraft SET status = ? WHERE _id = ?`
  try {
    const results = await pool.promise().query(updateTest, [status, id])
    res.status(200).json()
    console.log(results);

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
};