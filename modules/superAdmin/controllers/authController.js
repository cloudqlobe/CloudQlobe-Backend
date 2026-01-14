
const sendGMail = require("../../../utils/mailService");
const jwt = require("jsonwebtoken");
const pool = require("../../../config/db");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { forgotPasswordTemplate, superAdminLoginTemplate } = require("../../../utils/emailTemplates/superAdmin");

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

    // Generate token
    const numericToken = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryTime = new Date(Date.now() + 3 * 60 * 1000); // 3 min expiry

    await pool.promise().query(
      `INSERT INTO login_tokens (_id, role, token, expires_at) VALUES (?, ?, ?, ?)`,
      [admin.id, "superadmin", numericToken, expiryTime]
    );

    // ✅ Send Email with Template
    // await sendGMail({
    //   to: admin.email,
    //   subject: "🔐 Your SuperAdmin Login Token",
    //   html: superAdminLoginTemplate(admin.fullName, numericToken, 3),
    // });

    return res.status(200).json({
      message: "Token sent to email. Please enter the token to proceed.",
      adminId: admin.id,
    }); 
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}; 

 
exports.verifySuperAdminToken = async (req, res) => {
    try { 
        const { token, id } = req.body;
console.log(req.body);

        if (!token || !id) {
            return res.status(400).json({ message: "Token and admin ID are required" });
        }

        // Fetch token from DB
        const [tokenRows] = await pool.promise().query(
            "SELECT * FROM login_tokens WHERE _id = ? AND token = ?",
            [id, token]
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
            await pool.promise().query("DELETE FROM login_tokens WHERE _id = ?", [tokenEntry.id]);
            return res.status(410).json({ message: "Token expired" }); // Changed status to 410
        }


        // Delete used token
        await pool.promise().query("DELETE FROM login_tokens WHERE _id = ?", [tokenEntry.id]);

        // Fetch admin info
        const [adminRows] = await pool.promise().query(
            "SELECT * FROM superadmin WHERE id = ?",
            [id]
        );

        if (adminRows.length === 0) {
            return res.status(404).json({ message: "Admin not found" });
        }

        const admin = adminRows[0];

        // Generate final session JWT token
        const sessionToken = jwt.sign({ id: admin.id, email: admin.email, name: admin.fullName, role: admin.role, }, process.env.JWT_SECRET, {
            expiresIn: "24h",
        });
        // Set cookie
        res.cookie("SuperAdminAuthToken", sessionToken, {
            httpOnly: true,
            secure: false, // Set to true in production
            maxAge: 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            message: "Token verified. Admin authenticated.",
            sessionToken,
        });
    } catch (error) {
        console.error("Token verification error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

exports.logout = (req, res) => {

    res.clearCookie('SuperAdminAuthToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/', // MUST match the login cookie path
    });

    res.status(200).json({ message: 'Logged out successfully' });
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const [results] = await pool
      .promise()
      .query("SELECT id, email, fullName FROM superadmin WHERE email = ?", [
        email,
      ]);

    // Always return generic message (security best practice)
    if (results.length === 0) {
      return res.json({
        message:
          "If this email exists in our system, you will receive a reset link",
      });
    }

    const admin = results[0];
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await pool
      .promise()
      .query(
        "INSERT INTO login_tokens (_id, role, token, expires_at) VALUES (?, ?, ?, ?)",
        [admin.id, "superadmin", resetToken, expiresAt]
      );

    const resetUrl = `${process.env.FRONTEND_URL}/superadmin/reset-password?token=${resetToken}`;

    // ✅ Use template here
    await sendGMail({
      to: admin.email,
      subject: "SuperAdmin Password Reset Request",
      html: forgotPasswordTemplate(admin.fullName, resetUrl, 10),
    });


    return res.json({
      message:
        "If this email exists in our system, you will receive a reset link",
    });
  } catch (error) {
    console.error("SuperAdmin forgot password error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

 
exports.validateResetToken = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        const [results] = await pool.promise().query(
            'SELECT _id, role FROM login_tokens WHERE token = ? AND expires_at > NOW()',
            [token]
        );

        if (results.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        // Check if the token belongs to a superadmin
        const userId = results[0]._id;
        const role = results[0].role;

        if (role !== 'superadmin') {
            return res.status(403).json({ error: 'Invalid token for superadmin' });
        }

        res.json({
            valid: true,
            userId: userId,
            role: role
        });
    } catch (error) {
        console.error('Validate token error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check token in login_tokens table
        const [results] = await pool.promise().query(
            'SELECT _id, role FROM login_tokens WHERE token = ? AND expires_at > NOW()',
            [token]
        );

        if (results.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        const userId = results[0]._id;
        const userRole = results[0].role;

        // Hash the password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password in the appropriate table based on role
        await pool.promise().query(
            'UPDATE superadmin SET password = ? WHERE id = ?',
            [hashedPassword, userId]
        );


        // Delete token after use
        await pool.promise().query(
            'DELETE FROM login_tokens WHERE token = ?',
            [token]
        );

        res.json({ message: 'Password has been reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};