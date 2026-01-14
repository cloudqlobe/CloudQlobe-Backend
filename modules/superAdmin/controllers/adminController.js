const pool = require('../../../config/db');
const bcrypt = require("bcryptjs");
const saltRounds = 10;
const { adminWelcomeTemplate } = require('../../../utils/emailTemplates/superAdmin');
const sendGMail = require('../../../utils/mailService');
const jwt = require("jsonwebtoken");

exports.UpdateProfile = async (req, res) => {
  const { name, email } = req.body;
  const adminId = req.params.id; // should come from auth middleware

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  try {
    // Update in DB
    const updateQuery = "UPDATE superadmin SET fullName = ?, email = ? WHERE id = ?";
    await pool.promise().query(updateQuery, [name, email, adminId]);

    // Get updated record
    const [rows] = await pool
      .promise()
      .query("SELECT id, fullName, email, role FROM superadmin WHERE id = ?", [adminId]);

    const updatedUser = rows[0];

    if (!updatedUser) {
      return res.status(404).json({ error: "Super Admin not found" });
    }

    // Generate fresh token with updated details
    const sessionToken = jwt.sign(
      {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.fullName,
        role: updatedUser.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Set new cookie
    res.cookie("SuperAdminAuthToken", sessionToken, {
      httpOnly: true,
      secure: false, // true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000,
    });

    // Send response with both user + token
    res.json({
      user: updatedUser,
      token: sessionToken,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.ChangePassword = async (req, res) => {

  const { oldPassword, newPassword } = req.body;
  const adminId = req.params.id;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: "Old and new password are required" });
  }

  try {
    // Get existing password hash
    const [rows] = await pool
      .promise()
      .query("SELECT password FROM superadmin WHERE id = ?", [adminId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ error: "Old password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool
      .promise()
      .query("UPDATE superadmin SET password = ? WHERE id = ?", [
        hashedPassword,
        adminId,
      ]);

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password change error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


exports.createAdmin = async (req, res) => {
  const { fullName, email, password, role, status } = req.body;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  try {
    const duplicateEmail = "SELECT * FROM admin WHERE email = ?"
    pool.query(duplicateEmail, [email], (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
      if (result.length > 0) {
        return res.status(409).json({ message: "Email Already Exists" });
      }
      const adminData = {
        fullName,
        email,
        password: hashedPassword,
        role,
        status,
        created_at: new Date(),
      };

      const insertQuery = "INSERT INTO admin SET ?";
      pool.query(insertQuery, adminData, (err, results) => {
        if (err) {
          console.error("Insert error:", err);
          return res.status(500).send(err);
        }
        res.json({ message: "Admin added successfully", id: results });
      })
    })
    await sendGMail({
      to: email,
      subject: "Welcome to CloudQlobe CRM - Admin Access",
      html: adminWelcomeTemplate(fullName, email, password, role),
    });

  } catch (error) {
    console.error("Error", error)
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAllAdmin = async (req, res) => {
  const query = "SELECT * FROM admin";
  try {
    const [results] = await pool.promise().query(query);
    res.status(200).json({ admin: results });

  } catch (error) {
    console.error("Error fetching admin data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateAdmin = async (req, res) => {
  const { email, password } = req.body;
  const { id } = req.params;

  try {
    const duplicateEmailQuery = "SELECT * FROM admin WHERE email = ? AND id != ?";
    const [existingUsers] = await pool.promise().query(duplicateEmailQuery, [email, id]);

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: "Email Already Exists" });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const adminData = {
      ...req.body,
      password: hashedPassword
    };

    const updateQuery = "UPDATE admin SET ? WHERE id = ?";
    const [updateResults] = await pool.promise().query(updateQuery, [adminData, id]);

    if (updateResults.affectedRows === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.status(200).json({ message: "Admin updated successfully" });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteAdmin = async (req, res) => {
  const { id } = req.params
  const query = "DELETE FROM `admin` WHERE id = ?"
  try {
    const [result] = await pool.promise().query(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.status(200).json({ message: "deleted successfully" })
  } catch (error) {
    console.error("Error deleting admin:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteCustomer = async (req, res) => {
  const { id } = req.params
  const query = "DELETE FROM `customer` WHERE id = ?"
  try {
    const [result] = await pool.promise().query(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.status(200).json({ message: "deleted successfully" })
  } catch (error) {
    console.error("Error deleting admin:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.transferManager = async (req, res) => {
  const { customerId, userId, toManagerId, note, fromManager, toManager, date } = req.body;

  try {
    // Get current manager
    const [customerRows] = await pool.promise().query(
      'SELECT memberId FROM customer WHERE id = ?',
      [userId]
    );

    if (customerRows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const fromManagerId = customerRows[0].memberId;

    // Update customer
    await pool.promise().query(
      'UPDATE customer SET memberId = ?, accountManager = ? WHERE id = ?',
      [toManagerId, toManager, userId]
    );

    // Log transfer
    await pool.promise().query(
      `INSERT INTO manager_transfers (customerId, fromManagerId, toManagerId, note, fromManager, toManager, date, userId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [customerId, fromManagerId, toManagerId, note, fromManager, toManager, date, userId]
    );

    res.json({ message: 'Manager transferred successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to transfer manager' });
  }
};

exports.getManagerTransfers = async (req, res) => {
  const query = "SELECT * FROM manager_transfers";
  try {
    const [results] = await pool.promise().query(query);
    res.status(200).json({ transferManager: results });

  } catch (error) {
    console.error("Error fetching manager_transfers data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};