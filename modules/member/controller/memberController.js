const pool = require('../../../config/db');
const bcrypt = require("bcryptjs");
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

exports.supportMemberLogin = async (req, res) => {
  try {
    const { username, password, selectDepartment } = req.body;

    const [rows] = await pool.promise().query("SELECT * FROM supportmember WHERE email = ?", [username]);
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

  exports.leadMemberLogin = async (req, res) => {
    try {
      const { username, password, selectDepartment } = req.body;
  
      const [rows] = await pool.promise().query("SELECT * FROM leadmember WHERE email = ?", [username]);
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