const pool = require('../../../config/db');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendGMail = require('../../../utils/mailService');
const { AdminLoginTemplate } = require('../../../utils/emailTemplates/admin');

exports.adminLogin = async (req, res) => {
    try {
        const { username, password, selectDepartment } = req.body;

        const [rows] = await pool.promise().query("SELECT * FROM admin WHERE email = ?", [username]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Admin not found" });
        }

        const admin = rows[0];

        if (admin.status === "inactive" || admin.status === "block") {
            return res.status(402).json({
                message: `This account is ${admin.status}. Please contact the Super Admin.`,
            });
        }

        // Check if the department matches the role
        if (selectDepartment !== admin.role) {
            return res.status(404).json({ message: "Admin not found" });
        }

        // Compare passwords (Using bcrypt for security)
        const isPasswordMatch = await bcrypt.compare(password, admin.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }

        const numericToken = Math.floor(100000 + Math.random() * 900000).toString();
        const expiryTime = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes from now

        await pool.promise().query(
            `INSERT INTO login_tokens (_id, role, token, expires_at) VALUES (?, ?, ?, ?)`,
            [admin.id, selectDepartment, numericToken, expiryTime]
        );

        await sendGMail({
            to: admin.email,
            subject: "🔐 Your Admin Login Token",
            html: AdminLoginTemplate(admin.fullName, numericToken, 3),
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

exports.verifyAdminToken = async (req, res) => {
    try {
        let { token, adminId } = req.body;

        // Trim and remove quotes if present
        if (typeof adminId === "string") {
            adminId = adminId.replace(/"/g, "").trim();
        }
        if (typeof token === "string") {
            token = token.trim();
        }

        // Validate input formats
        if (!token || !adminId) {
            return res.status(400).json({ message: "Token and admin ID are required" });
        }
        if (!/^\d{6}$/.test(token)) {
            return res.status(400).json({ message: "Invalid token format" });
        }
        if (!/^[a-f0-9-]{36}$/i.test(adminId)) {
            return res.status(400).json({ message: "Invalid admin ID format" });
        }

        // Fetch token from DB
        const [tokenRows] = await pool.promise().query(
            "SELECT * FROM login_tokens WHERE _id = ? AND token = ?",
            [adminId, token]
        );

        if (tokenRows.length === 0) {
            return res.status(401).json({ message: "Invalid or already used token" });
        }

        const tokenEntry = tokenRows[0];
        const now = new Date();

        // Check expiration
        if (now > new Date(tokenEntry.expires_at)) {
            await pool.promise().query("DELETE FROM login_tokens WHERE _id = ?", [tokenEntry.id]);
            return res.status(410).json({ message: "Token expired" });
        }

        // Delete used token
        await pool.promise().query("DELETE FROM login_tokens WHERE _id = ?", [tokenEntry.id]);

        // Fetch admin info
        const [adminRows] = await pool.promise().query(
            "SELECT * FROM admin WHERE id = ?",
            [adminId]
        );

        if (adminRows.length === 0) {
            return res.status(404).json({ message: "Admin not found" });
        }

        const admin = adminRows[0];

        // Generate JWT token
        const sessionToken = jwt.sign(
            {
                id: admin.id,
                username: admin.email,
                name: admin.fullName,
                role: admin.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        // Set cookie
        res.cookie("AdminAuthToken", sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 24 * 60 * 60 * 1000,
        });

        // Send response
        return res.status(200).json({
            message: "Token verified. Admin authenticated.",
            adminData: sessionToken,
        });
    } catch (error) {
        console.error("Token verification error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};


exports.logout = (req, res) => {

    res.clearCookie('AdminAuthToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/', // MUST match the login cookie path
    });

    res.status(200).json({ message: 'Logged out successfully' });
};

