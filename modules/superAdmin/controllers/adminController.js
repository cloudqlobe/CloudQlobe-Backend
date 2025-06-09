const pool = require('../../../config/db');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const saltRounds = 10;
const nodemailer = require("nodemailer");
const crypto = require("crypto");

exports.superAdminLogin = async (req, res) => {
  try {
    const { username, password, selectDepartment } = req.body;

    const [rows] = await pool.promise().query("SELECT * FROM superadmin WHERE email = ?", [username]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "SuperAdmin not found" });
    }

    const admin = rows[0];

    if (selectDepartment !== admin.role) {
      return res.status(403).json({ message: "Unauthorized department access" });
    }

    const isPasswordMatch = await bcrypt.compare(password, admin.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Generate a 6-digit token (e.g., 963585)
    const numericToken = Math.floor(100000 + Math.random() * 900000).toString();

    // Save token + expiry to DB or temporary table (example using a temp table)
    const expiryTime = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes from now

    await pool.promise().query(
      `INSERT INTO login_tokens (admin_id, token, expires_at) VALUES (?, ?, ?)`,
      [admin.id, numericToken, expiryTime]
    );

    // Send token via email using Nodemailer
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      }
    });

    await transporter.sendMail({
      from: `"Super Admin Login" <${process.env.EMAIL}>`,
      to: admin.email,
      subject: "Your Login Token",
      text: `Your 6-digit login token is: ${numericToken}\n\nIt will expire in 3 minutes.`,
    });

    // Respond with success (but don't send token back to frontend)
    return res.status(200).json({
      message: "Token sent to email. Please enter the token to proceed.",
      adminId: admin.id, // required for token verification step
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.verifySuperAdminToken = async (req, res) => {
  try {
    const { token, adminId } = req.body;

    if (!token || !adminId) {
      return res.status(400).json({ message: "Token and admin ID are required" });
    }

    // Fetch token from DB
    const [tokenRows] = await pool.promise().query(
      "SELECT * FROM login_tokens WHERE admin_id = ? AND token = ?",
      [adminId, token]
    );

    if (tokenRows.length === 0) {
      return res.status(401).json({ message: "Invalid or already used token" });
    }

    if (tokenRows.length === 0) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const tokenEntry = tokenRows[0];
    const now = new Date();

    if (now > new Date(tokenEntry.expires_at)) {
      await pool.promise().query("DELETE FROM login_tokens WHERE id = ?", [tokenEntry.id]);
      return res.status(410).json({ message: "Token expired" }); // Changed status to 410
    }


    // Delete used token
    await pool.promise().query("DELETE FROM login_tokens WHERE id = ?", [tokenEntry.id]);

    // Fetch admin info
    const [adminRows] = await pool.promise().query(
      "SELECT * FROM superadmin WHERE id = ?",
      [adminId]
    );

    if (adminRows.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const admin = adminRows[0];

    // Generate final session JWT token
    const sessionToken = jwt.sign({ id: admin.id, username: admin.email, name: admin.fullName, role: admin.role, }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });
    // Set cookie
    res.cookie("Token", sessionToken, {
      httpOnly: true,
      secure: false, // Set to true in production
      maxAge: 24 * 60 * 60 * 1000,
    });

    // Send full admin data
    const adminData = {
      username: admin.email,
      name: admin.fullName,
      role: admin.role,
      id: admin.id,
    };

    return res.status(200).json({
      message: "Token verified. Admin authenticated.",
      adminData,
    });
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


exports.createAdmin = async (req, res) => {
  const { email, password } = req.body;
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
        ...req.body,
        password: hashedPassword
      }
      console.log(adminData);

      const insertQuery = "INSERT INTO admin SET ?";
      pool.query(insertQuery, adminData, (err, results) => {
        if (err) {
          console.error("Insert error:", err);
          return res.status(500).send(err);
        }
        res.json({ message: "Admin added successfully", id: results });
      })
    })
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