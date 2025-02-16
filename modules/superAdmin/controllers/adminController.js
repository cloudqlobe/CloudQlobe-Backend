const pool = require('../../../config/db');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const saltRounds = 10;

exports.superAdminLogin = async (req, res) => {
  try {
    const { username, password, selectDepartment } = req.body;

    // Fetch superAdmin from MySQL using `pool.promise().query()`
    const [rows] = await pool.promise().query("SELECT * FROM superadmin WHERE email = ?", [username]);
    console.log(rows);

    if (rows.length === 0) {
      return res.status(404).json({ message: "SuperAdmin not found" });
    }

    const admin = rows[0];

    // Check if the department matches the role
    if (selectDepartment !== admin.role) {
      return res.status(404).json({ message: "SuperAdmin not found" });
    }

    // Compare passwords (Using bcrypt for security)
    const isPasswordMatch = await bcrypt.compare(password, admin.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: admin.id }, process.env.JWT_SECRET, { expiresIn: "24h" });

    console.log("Generated Token:", token);

    // Set the token in a cookie
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: false, // Set to `true` in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Admin Data Response
    const adminData = {
      username: admin.email,
      role: admin.role,
      id: admin.id
    };

    return res.status(200).json({ message: "Login successful", adminData });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
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
    res.status(200).json({message: "deleted successfully"})
  } catch (error) {
    console.error("Error deleting admin:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};