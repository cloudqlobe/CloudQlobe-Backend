const crypto = require('crypto');

const nodemailer = require('nodemailer');
const pool = require('../../../config/db');
const { hashPassword } = require('../utils/passwordUtils');

// Configure email transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    console.log(email);

    try {
        // Check if user exists
        const [results] = await pool.promise().query(
            'SELECT id, userEmail FROM customer WHERE userEmail = ?',
            [email]
        );

        if (results.length === 0) {
            return res.status(404).json({ message: 'If this email exists in our system, you will receive a reset link' });
        }

        const user = results[0];

        // Generate reset token with 1 minute expiry
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 600000; // 1 minute from now

        // Store token in database
        await pool.promise().query(
            'UPDATE customer SET resetToken = ?, resetTokenExpiry = ? WHERE id = ?',
            [resetToken, new Date(resetTokenExpiry), user.id]
        );

        // Send email
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        const mailOptions = {
            from: `"Your App Name" <${process.env.EMAIL_FROM}>`,
            to: user.userEmail,
            subject: 'Password Reset Request',
            html: `
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 10 min.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
        };

        // await transporter.sendMail(mailOptions);
        console.log(mailOptions);

        res.status(200).json({
            message: 'If this email exists in our system, you will receive a reset link',
            resetUrl: resetUrl,
            mailSent: true
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'An error occurred. Please try again.' });
    }
};

exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        // Check if token exists and is not expired
        const [results] = await pool.promise().query(
            'SELECT id, resetTokenExpiry FROM customer WHERE resetToken = ?',
            [token]
        );

        if (results.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const user = results[0];

        if (new Date() > new Date(user.resetTokenExpiry)) {
            return res.status(400).json({ message: 'Token has expired' });
        }

        // Validate password
        const passwordRegex = /^(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters with at least one special character'
            });
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Update password and clear reset token
        await pool.promise().query(
            'UPDATE customer SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?',
            [hashedPassword, user.id]
        );

        res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'An error occurred. Please try again.' });
    }
};

exports.logout = (req, res) => {
    
    res.clearCookie("authToken", {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });
  
    res.status(200).json({ message: "Logged out successfully" });
  };
   