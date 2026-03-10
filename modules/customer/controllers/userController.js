const pool = require('../../../config/db');
const { verifyPassword, hashPassword } = require('../utils/passwordUtils');

exports.createCustomer = async (req, res) => {
  try {
    // Destructure the nested objects from frontend
    const {
      company: companyDetails,
      user: userDetails,
      technical: technicalDetails
    } = req.body;

    // Validate required fields
    if (!companyDetails?.companyName || !userDetails?.userEmail) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check for duplicate records
    const duplicateCheckQuery = `
      SELECT * FROM leads 
      WHERE companyName = ? OR companyEmail = ? OR username = ? OR userEmail = ?
    `;

    pool.query(duplicateCheckQuery, [
      companyDetails.companyName,
      companyDetails.companyEmail,
      userDetails.username,
      userDetails.userEmail
    ], async (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (results.length > 0) {
        const duplicateFields = [];
        results.forEach(customer => {
          if (customer.companyName === companyDetails.companyName) duplicateFields.push("companyName");
          if (customer.companyEmail === companyDetails.companyEmail) duplicateFields.push("companyEmail");
          if (customer.username === userDetails.username) duplicateFields.push("username");
          if (customer.userEmail === userDetails.userEmail) duplicateFields.push("userEmail");
        });

        return res.status(400).json({
          error: "Duplicate data found",
          duplicateFields: [...new Set(duplicateFields)],
        });
      }

      // Generate customer ID
      const generateCustomerId = (companyName) => {
        const namePart = companyName.slice(0, 4).toUpperCase();
        const numberPart = Math.floor(1000 + Math.random() * 9000);
        return `${namePart}${numberPart}`;
      };

      const customerId = generateCustomerId(companyDetails.companyName);

      // Prepare data for insertion
      const newCustomerData = {
        // Company Details
        ...companyDetails,
        // User Details
        ...userDetails,
        userFirstname: userDetails.userFirstname,
        userLastname: userDetails.userLastname,
        userMobile: userDetails.userMobile,
        designation: userDetails.designation,
        // Technical Details
        supportEmail: technicalDetails.supportEmail,
        sipPort: technicalDetails.sipPort,
        switchIps: JSON.stringify(technicalDetails.switchIps || []),
        // System Fields
        customerId,
        leadStatus: req.body.leadStatus || "new",
        leadType: "Customer lead",
        createdAt: new Date(),
      };

      // Insert new customer
      const insertQuery = "INSERT INTO leads SET ?";

      pool.query(insertQuery, newCustomerData, (err, results) => {
        if (err) {
          console.error("Insert error:", err);
          return res.status(500).json({
            error: "Database insertion failed",
            details: err.message
          });
        }

        // Success response
        res.status(201).json({
          success: true,
          message: "Customer created successfully",
          customerId,
          insertId: results.insertId
        });
      });
    });

  } catch (error) {
    console.error("Error in createCustomer:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
};

exports.getAllCustomers = async (req, res) => {
  const query = "SELECT * FROM customer";
  try {
    const [results] = await pool.promise().query(query);
    res.status(200).json({ customer: results })
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}


exports.getCustomer = (req, res) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: "Customer ID is required" });
  }

  const query = "SELECT * FROM customer WHERE id = ?";;

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


exports.updateSwitchIps = (req, res) => {
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

exports.createMyRate = async (req, res) => {
  const { id } = req.params;

  const fetchQuery = "SELECT myRates FROM customer WHERE id = ?";
  const updateQuery = "UPDATE customer SET myRates = ? WHERE id = ?";

  try {
    const [rows] = await pool.promise().query(fetchQuery, [id]);

    // Parse existing rates, ensuring it's an array
    let existingRates = rows.length > 0 && rows[0].myRates ? JSON.parse(rows[0].myRates) : [];

    if (!Array.isArray(existingRates)) {
      existingRates = [];
    }

    // Append the new rate structure
    existingRates.push(req.body);

    // Convert back to JSON and update the database
    await pool.promise().query(updateQuery, [JSON.stringify(existingRates), id]);

    res.json({ success: true, message: "Rates updated successfully." });

  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.createTestRate = async (req, res) => {
  const rate = req.body;

  if (!rate || Object.keys(rate).length === 0) {
    return res.status(400).json({ error: "Missing required data" });
  }

  const query = "INSERT INTO testrate SET ?";

  try {
    const rateId = JSON.stringify(rate.rateId); // Stringify rateId

    const testrate = {
      ...rate,
      rateId: rateId, // Assign the stringified rateId
    };

    const [results] = await pool.promise().query(query, testrate);
    res.json({ message: "TestRate added successfully" });
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAllTestRate = async (req, res) => {
  const query = "SELECT * FROM testrate";
  try {
    const [results] = await pool.promise().query(query);
    res.status(200).json({ testrate: results })
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.createTroubleTicket = async (req, res) => {
  const query = "INSERT INTO troubletickets SET ?"
  try {
    const result = pool.promise().query(query, [req.body])
    res.status(201).json({ message: "troubleTicket added" })
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAllTroubleTicket = async (req, res) => {
  const query = "SELECT * FROM troubletickets";
  try {
    const [results] = await pool.promise().query(query);
    res.status(200).json({ troubletickets: results })
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getTroubleTicket = async (req, res) => {
  try {
    const { customerId } = req.query;

    let query = "SELECT * FROM troubletickets";
    const values = [];

    if (customerId) {
      query += " WHERE customerDBId = ?";
      values.push(customerId);
    }

    query += " ORDER BY ticketTime DESC";

    const [results] = await pool.promise().query(query, values);

    res.status(200).json({
      troubletickets: results,
    });

  } catch (error) {
    console.error("Database fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.createCustomerEnquiry = async (req, res) => {
  const query = "INSERT INTO enquiry SET ?"
  try {
    const result = pool.promise().query(query, [req.body])
    res.status(201).json({ message: "enquiry added" })
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.createCustomerDidNumber = async (req, res) => {
  const query = "INSERT INTO didnumber SET ?"
  try {
    const result = pool.promise().query(query, [req.body])
    res.status(201).json({ message: "	didnumber added" })
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.createCustomerFreeTest = async (req, res) => {
  const query = "INSERT INTO free_test SET ?"
  try {
    const result = pool.promise().query(query, [req.body])
    res.status(201).json({ message: "	free_test added" })
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


// Verify current password
exports.verifyCurrentPassword = async (req, res) => {
  const { customerId, password } = req.body;

  if (!customerId || !password) {
    return res.status(400).json({ error: "Customer ID and password are required" });
  }

  try {
    // Get the hashed password from database
    const [results] = await pool.promise().query(
      'SELECT password FROM customer WHERE id = ?',
      [customerId]
    );

    if (results.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const hashedPassword = results[0].password;
    const isValid = await verifyPassword(password, hashedPassword);

    res.status(200).json({ isValid });
  } catch (error) {
    console.error("Error verifying password:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Update password
exports.updatePassword = async (req, res) => {
  const customerId = req.params.customerId;
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ error: "New password is required" });
  }

  // Validate password meets requirements (min 6 chars, special char)
  const passwordRegex = /^(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      error: "Password must be at least 6 characters with at least one special character"
    });
  }

  try {
    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password in database
    await pool.promise().query(
      'UPDATE customer SET password = ? WHERE id = ?',
      [hashedPassword, customerId]
    );

    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};







