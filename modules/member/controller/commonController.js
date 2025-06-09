const pool = require('../../../config/db');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const saltRounds = 10;

//Sale

exports.saleMemberLogin = async (req, res) => {
  try {
    const { username, password, selectDepartment } = req.body;

    const [rows] = await pool.promise().query("SELECT * FROM salemember WHERE email = ?", [username]);
    console.log(rows);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Member not found" });
    }

    const admin = rows[0];

    // Check if the department matches the role
    if (selectDepartment !== admin.role) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Compare passwords (Using bcrypt for security)
    const isPasswordMatch = await bcrypt.compare(password, admin.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Generate JWT token
    const token = jwt.sign({ username: admin.email, id: admin.id, role: admin.role, name: admin.fullName }, process.env.JWT_SECRET, { expiresIn: "24h" });

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

exports.carrierMemberLogin = async (req, res) => {
  try {
    const { username, password, selectDepartment } = req.body;

    const [rows] = await pool.promise().query("SELECT * FROM carriermember WHERE email = ?", [username]);
    console.log(rows);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Member not found" });
    }

    const admin = rows[0];

    // Check if the department matches the role
    if (selectDepartment !== admin.role) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Compare passwords (Using bcrypt for security)
    const isPasswordMatch = await bcrypt.compare(password, admin.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: admin.id, username: admin.email, role: admin.role, name: admin.fullName, }, process.env.JWT_SECRET, { expiresIn: "24h" });

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

//Lead

exports.leadMemberLogin = async (req, res) => {
  try {
    const { username, password, selectDepartment } = req.body;

    const [rows] = await pool.promise().query("SELECT * FROM lead_members WHERE email = ?", [username]);
    console.log(rows);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Member not found" });
    }

    const admin = rows[0];

    // Check if the department matches the role
    if (selectDepartment !== admin.role) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Compare passwords (Using bcrypt for security)
    const isPasswordMatch = await bcrypt.compare(password, admin.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: admin.id, username: admin.email, role: admin.role, name: admin.fullName, }, process.env.JWT_SECRET, { expiresIn: "24h" });
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

exports.getLead = async (req, res) => {
  const { id } = req.params;
  console.log(id);

  const query = "SELECT * FROM customer WHERE memberId = ?";
  try {
    const [results] = await pool.promise().query(query, [id]);
    console.log([results]);

    res.status(200).json({ customer: results })
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getLeadMember = async (req, res) => {
  const { id } = req.params;
  console.log(id);

  const query = "SELECT * FROM lead_members WHERE id = ?";
  try {
    const [[results]] = await pool.promise().query(query, [id]);
    res.status(200).json({ member: results })
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateLeadStatus = async (req, res) => {
  const { id } = req.params;
  const { leadStatus } = req.body;
  const updateQuery = `UPDATE customer SET leadStatus = ? WHERE id = ?`
  try {
    const result = await pool.promise().query(updateQuery, [leadStatus, id]);
    res.status(200).json({ message: "successFully update" })
  } catch (error) {
    console.error("error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.LeadConversion = async (req, res) => {
  const { id } = req.params;
  const { customerType, leadType, customerId } = req.body;

  const updateQuery = `UPDATE customer SET customerType = ?, leadType = ?, customerId = ? WHERE id = ?`
  try {
    const result = await pool.promise().query(updateQuery, [customerType, leadType, customerId, id]);
    res.status(200).json({ message: "successFully update" })
  } catch (error) {
    console.error("error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.createNewLead = async (req, res) => {
  console.log(req.body);

  const { companyName, companyEmail, username, userEmail, password, switchIps, leadType } = req.body;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Check for duplicate records
  const duplicateCheckQuery = `
        SELECT * FROM customer 
        WHERE companyName = ? OR companyEmail = ? OR username = ? OR userEmail = ?
    `;

  pool.query(duplicateCheckQuery, [companyName, companyEmail, username, userEmail], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (results.length > 0) {
      const duplicateFields = [];
      results.forEach(customer => {
        if (customer.companyName === companyName) duplicateFields.push("companyName");
        if (customer.companyEmail === companyEmail) duplicateFields.push("companyEmail");
        if (customer.username === username) duplicateFields.push("username");
        if (customer.userEmail === userEmail) duplicateFields.push("userEmail");
      });

      return res.status(400).json({
        error: "Duplicate data found",
        duplicateFields: duplicateFields,
      });
    };

    function generateCustomerId(companyName, leadType) {
      // Process company name to get the abbreviation
      const words = companyName.trim().split(/\s+/).filter(word => word.length > 0);
      let abbreviation = '';

      if (words.length === 1) {
        // Single word: first + last letter
        abbreviation = words[0][0] + (words[0].length > 1 ? words[0][words[0].length - 1] : '');
      } else {
        // Multiple words: first letter of each word
        abbreviation = words.map(word => word[0]).join('');
      }
      abbreviation = abbreviation.toUpperCase();

      // Generate ID based on leadType
      if (leadType === "Customer") {
        return `MGW 31215214${abbreviation}`;
      } else if (leadType === "Carrier") {
        return `TGW 17121525${abbreviation}`;
      } else {
        // Default case
        const namePart = companyName.slice(0, 4).toUpperCase();
        const numberPart = Math.floor(1000 + Math.random() * 9000);
        return `${namePart}${numberPart}`;
      }
    }

    const customerId = generateCustomerId(companyName, leadType);

    const newCustomerData = {
      ...req.body,
      customerId: customerId,
      password: hashedPassword,
      switchIps: JSON.stringify(switchIps || []), // Ensure it's a valid JSON array
      customerType: req.body.customerType || "Lead",
      customerStatus: req.body.customerStatus || "inactive",
      leadStatus: req.body.leadStatus || "new",
      leadType: req.body.leadType || "New lead",
    };

    // Insert new customer into the database
    const insertQuery = "INSERT INTO customer SET ?";

    pool.query(insertQuery, newCustomerData, (err, results) => {
      if (err) {
        console.error("Insert error:", err);
        return res.status(500).send(err);
      }

      res.json({ message: "Customer added successfully", id: results.insertId });
    });
  });
};

exports.getMyRate = async (req, res) => {

  const query = "SELECT * FROM myrates";
  try {
    const [results] = await pool.promise().query(query);
    res.status(200).json({ myRates: results })
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateCustomer = async (req, res) => {
  const { id } = req.params;
  let updateData = { ...req.body };

  if (!id || Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: "Invalid request data" });
  }

  // Convert switchIps and myRates to JSON string if they exist
  if (updateData.switchIps) {
    updateData.switchIps = JSON.stringify(updateData.switchIps);
  }
  if (updateData.myRates) {
    updateData.myRates = JSON.stringify(updateData.myRates);
  }

  // Duplicate check query
  const duplicateCheckQuery = `
    SELECT * FROM customer
    WHERE id != ? AND (
      companyName = ? OR 
      companyEmail = ? OR 
      companyWebsite = ? OR 
      username = ? OR 
      userEmail = ?
    )
  `;

  const { companyName, companyEmail, companyWebsite, username, userEmail } = updateData;

  try {
    const [results] = await pool.promise().query(duplicateCheckQuery, [
      id,
      companyName,
      companyEmail,
      companyWebsite,
      username,
      userEmail,
    ]);

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
        duplicateFields: [...new Set(duplicateFields)], // Remove duplicate field names
      });
    }

    // Proceed with update if no duplicates found
    const fields = Object.keys(updateData).map(field => `${field} = ?`).join(", ");
    const values = Object.values(updateData);
    const updateQuery = `UPDATE customer SET ${fields} WHERE id = ?`;

    await pool.promise().query(updateQuery, [...values, id]);
    res.status(200).json({ message: "Customer updated successfully" });

  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};



exports.getAllFollowup = async (req, res) => {
  const query = "SELECT * FROM customerfollowup";
  try {
    const [results] = await pool.promise().query(query);
    res.status(200).json({ followups: results })
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getCustomerFollowupsByMemberId = async (req, res) => {
  const { id } = req.params;
  console.log(id);

  const query = "SELECT * FROM customerfollowup WHERE memberId = ?";
  try {
    const [results] = await pool.promise().query(query, [id]);
    res.status(200).json({ followups: results })
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getCustomerFollowups = async (req, res) => {
  const { id } = req.params;
  console.log(id);

  const query = "SELECT * FROM customerfollowup WHERE customerId = ?";
  try {
    const [results] = await pool.promise().query(query, [id]);
    res.status(200).json({ followups: results })
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getFollowupsByCategory = async (req, res) => {
  const { id } = req.params;

  const query = "SELECT * FROM customerfollowup WHERE followupCategory = ?";
  try {
    const [results] = await pool.promise().query(query, [id]);
    console.log(results);

    res.status(200).json({ followups: results })
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getFollowups = async (req, res) => {
  const { id } = req.params;
  console.log(id);

  const query = "SELECT * FROM customerfollowup WHERE followupId = ?";
  try {
    const [results] = await pool.promise().query(query, [id]);
    res.status(200).json({ followups: results })
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.createCustomerFollowup = async (req, res) => {
  const newFollowUp = req.body;
  console.log(newFollowUp);

  const insertQuery = "INSERT INTO customerfollowup SET ?";
  try {
    const [results] = await pool.promise().query(insertQuery, [newFollowUp]);
    res.status(200).json({ followups: results })
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateFollowHistory = async (req, res) => {
  const { id } = req.params;
  const { followupHistory, followupMethod, followupStatus, nextFollowupTime } = req.body;

  console.log("Received Follow-up Data:", req.body);

  const fetchQuery = "SELECT followupHistory FROM customerfollowup WHERE followupId = ?";
  const updateQuery = `
    UPDATE customerfollowup 
    SET followupHistory = ?, followupMethod = ?, followupStatus = ?, nextFollowupTime = ? 
    WHERE followupId = ?
  `;

  try {
    let existingHistory = []; // Changed from const to let

    // Append the new follow-up history (if provided)
    if (followupHistory && Array.isArray(followupHistory)) {
      existingHistory = [...followupHistory];
    }

    // Convert back to JSON and update the database
    await pool.promise().query(updateQuery, [
      JSON.stringify(existingHistory),
      followupMethod,
      followupStatus,
      nextFollowupTime,
      id
    ]);

    console.log("Updated Follow-up History:", existingHistory);
    res.status(200).json({ success: true, message: "Follow-up history updated successfully." });

  } catch (error) {
    console.error("Database update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.createPrivateCCRate = async (req, res) => {
  const ccrate = req.body;
  console.log(ccrate);

  const insertQuery = "INSERT INTO cc_private_rate SET ?";
  try {
    const [results] = await pool.promise().query(insertQuery, [ccrate]);
    res.status(200).json({ ccrate: results })
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getPrivateCCRate = async (req, res) => {
  const { id } = req.params;

  const query = "SELECT * FROM cc_private_rate WHERE customerId = ?";
  try {
    const [results] = await pool.promise().query(query, [id]);
    res.status(200).json({ ccrate: results })
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.createPrivateCLIRate = async (req, res) => {
  const clirate = req.body;
  console.log(clirate);

  const insertQuery = "INSERT INTO cli_private_rate SET ?";
  try {
    const [results] = await pool.promise().query(insertQuery, [clirate]);
    res.status(200).json({ clirate: results })
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getPrivateCLIRate = async (req, res) => {
  const { id } = req.params;

  const query = "SELECT * FROM cli_private_rate WHERE customerId = ?";
  try {
    const [results] = await pool.promise().query(query, [id]);
    res.status(200).json({ clirate: results })
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAllPrivateCLIRate = async (req, res) => {

  const query = "SELECT * FROM cli_private_rate";
  try {
    const [results] = await pool.promise().query(query);
    res.status(200).json({ clirate: results })
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAllPrivateCCRate = async (req, res) => {

  const query = "SELECT * FROM cc_private_rate";
  try {
    const [results] = await pool.promise().query(query);
    res.status(200).json({ ccrate: results })
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.testPrivateRate = async (req, res) => {
  const rate = req.body;

  const rateId = JSON.stringify(rate.rateId);

  const privateRate = {
    ...rate,
    rateId: rateId,
  };

  const insertQuery = "INSERT INTO test_private_rate SET ?";
  try {
    const [results] = await pool.promise().query(insertQuery, [privateRate]);
    res.status(200).json({ rate: results })
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getTestPrivateRate = async (req, res) => {
  const { id } = req.params;

  const query = "SELECT * FROM test_private_rate WHERE customerId = ?";
  try {
    const [results] = await pool.promise().query(query, [id]);
    res.status(200).json({ rate: results })
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAllTestPrivateRate = async (req, res) => {
  const query = "SELECT * FROM test_private_rate";
  try {
    const [results] = await pool.promise().query(query);
    res.status(200).json({ rate: results })
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

