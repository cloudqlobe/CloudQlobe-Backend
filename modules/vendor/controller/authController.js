const pool = require('../../../config/db');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465, // Gmail SSL port
  secure: true, // true for 465, false for 587
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // bypass self-signed cert errors
  },
});

// Send verification email
async function sendVerificationEmail(email, token, firstName, userLastname) {
    const mailOptions = {
        from: `${process.env.EMAIL}`,
        to: email,
        subject: 'Your Verification Token',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Hi ${firstName}${userLastname},</h2>
        <p>Your verification token is:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; font-size: 24px; letter-spacing: 2px;">
          <strong>${token}</strong>
        </div>
        <p>This token will expire in 15 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Verification token sent to ${email}`);
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw new Error('Failed to send verification email');
    }
}

exports.createVendor = async (req, res) => {

  try {
    const {
      company: companyDetails,
      user: userDetails,
      technical: technicalDetails
    } = req.body;

    /* ---------------- Required Field Validation ---------------- */
    if (
      !companyDetails?.companyName ||
      !companyDetails?.companyEmail ||
      !userDetails?.userEmail
    ) {
      return res.status(400).json({
        error: "Missing required fields",
        fields: ["companyName", "companyEmail", "userEmail"]
      });
    }

    /* ---------------- Duplicate Check ---------------- */
    const duplicateCheckQuery = `
      SELECT * FROM leads
      WHERE companyName = ?
         OR companyEmail = ?
         OR userEmail = ?
    `;

    pool.query(
      duplicateCheckQuery,
      [
        companyDetails.companyName,
        companyDetails.companyEmail,
        userDetails.userEmail,
      ],
      async (err, results) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: "Internal server error" });
        }

        if (results.length > 0) {
          const duplicateFields = [];

          results.forEach(row => {
            if (row.companyName === companyDetails.companyName)
              duplicateFields.push("companyName");
            if (row.companyEmail === companyDetails.companyEmail)
              duplicateFields.push("companyEmail");
            if (row.userEmail === userDetails.userEmail)
              duplicateFields.push("userEmail");
          });

          return res.status(400).json({
            error: "Duplicate data found",
            duplicateFields: [...new Set(duplicateFields)]
          });
        }

        /* ---------------- Customer ID Generation ---------------- */
        const generateCustomerId = (companyName) => {
          const namePart = companyName.slice(0, 4).toUpperCase();
          const numberPart = Math.floor(1000 + Math.random() * 9000);
          return `${namePart}${numberPart}`;
        };

        const customerId = generateCustomerId(companyDetails.companyName);

        /* ---------------- Prepare Insert Data ---------------- */
        const newCustomerData = {
          // Company
          ...companyDetails,

          // User
          userFirstname: userDetails.userFirstname,
          userLastname: userDetails.userLastname,
          userEmail: userDetails.userEmail,
          userMobile: userDetails.userMobile,
          designation: userDetails.designation,

          // Technical
          supportEmail: technicalDetails.supportEmail,
          sipPort: technicalDetails.sipPort,
          switchIps: JSON.stringify(technicalDetails.switchIps || []),

          // System
          customerId,
          leadStatus: "new",
          leadType: "Carrier lead",
          createdAt: new Date()
        };

        /* ---------------- Insert Query ---------------- */
        const insertQuery = "INSERT INTO leads SET ?";

        pool.query(insertQuery, newCustomerData, async (err, results) => {
          if (err) {
            console.error("Insert error:", err);
            return res.status(500).json({
              error: "Database insertion failed",
              details: err.message
            });
          }

          return res.status(201).json({
            success: true,
            message: "Vendor created successfully",
            customerId,
            insertId: results.insertId
          });
        });
      }
    );
  } catch (error) {
    console.error("Error in createVendor:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
};


exports.VendorLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("vendor login", req.body);

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const query = 'SELECT * FROM vendors WHERE username = ? OR customerId = ?';
    const [results] = await pool.promise().query(query, [username, username]);

    if (results.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const vendor = results[0];
    console.log(vendor.password);

    const isMatch = await bcrypt.compare(password, vendor.password);
    console.log(isMatch);

    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    // Generate 6-digit token
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiration

    await pool.promise().query(
      "INSERT INTO login_tokens (_id, role, token, expires_at) VALUES (?, ?, ?, ?)",
      [vendor.id, "vendor", token, expiresAt]
    );

    // Send verification email
    await sendVerificationEmail(vendor.userEmail, token, vendor.userFirstname, vendor.userLastname);
    console.log("token", token);

    // Generate temporary JWT token
    const tempAuthToken = jwt.sign(
      {
        id: vendor.id,
        role: 'vendor',
        customerId: vendor.customerId,
        companyName: vendor.companyName,
        requiresVerification: true,
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } // Short expiry for verification
    );

    res.json({
      message: 'Verification token sent to your email',
      requiresVerification: true,
      tempAuthToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.VerifyToken = async (req, res) => {
  try {
    const { token, tempAuthToken } = req.body;

    if (!token || !tempAuthToken) {
      return res.status(400).json({ error: 'Token and temporary auth token are required' });
    }

    // Verify the temporary auth token
    const decoded = jwt.verify(tempAuthToken, process.env.JWT_SECRET);

    // Check verification token in database
    const [tokenResults] = await pool.promise().query(
      'SELECT * FROM login_tokens WHERE _id = ? AND token = ? AND expires_at > NOW() AND role = ?',
      [decoded.id, token, 'vendor']
    );

    if (tokenResults.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    // Get vendor details
    const [vendorResults] = await pool.promise().query(
      'SELECT * FROM vendors WHERE id = ?',
      [decoded.id]
    );

    if (vendorResults.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const vendor = vendorResults[0];

    // Clear the verification token
    await pool.promise().query(
      'DELETE FROM login_tokens WHERE _id = ? AND role = ?',
      [vendor.id, 'vendor']
    );

    // Generate final auth token
    const authToken = jwt.sign(
      {
        id: vendor.id,
        companyEmail: vendor.companyEmail,
        role: 'vendor',
        customerId: vendor.customerId,
        companyName: vendor.companyName,
        name: vendor.userFirstname + vendor.userLastname,
        address: vendor.address
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('Ven-Au-To', authToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax', // works with most cross-site cases in dev
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({
      message: 'Verification successful',
      authToken
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.ResendToken = async (req, res) => {
    try {
        const { tempAuthToken } = req.body;

        if (!tempAuthToken) {
            return res.status(400).json({ error: 'Temporary auth token is required' });
        }

        // Verify the temporary auth token
        const decoded = jwt.verify(tempAuthToken, process.env.JWT_SECRET);

        // Get vendor from database
        const [vendorResults] = await pool.promise().query(
            'SELECT * FROM vendors WHERE id = ?',
            [decoded.id]
        );

        if (vendorResults.length === 0) {
            return res.status(404).json({ error: 'Vendor not found' });
        }

        const vendor = vendorResults[0];

        // Generate new 6-digit token
        const token = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiration

        // Clear any existing tokens
        await pool.promise().query(
            'DELETE FROM login_tokens WHERE _id = ? AND role = ?',
            [vendor.id, 'vendor']
        );

        // Insert new token
        await pool.promise().query(
            'INSERT INTO login_tokens (_id, role, token, expires_at) VALUES (?, ?, ?, ?)',
            [vendor.id, 'vendor', token, expiresAt]
        );

        // Send new token to user's email
        await sendVerificationEmail(vendor.userEmail, token, vendor.userFirstname);

        res.json({ message: 'New verification token sent to your email' });
    } catch (error) {
        console.error('Resend token error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const [results] = await pool.promise().query(
      'SELECT id, userEmail, userFirstname FROM vendors WHERE userEmail = ?',
      [email]
    );

    if (results.length === 0) {
      // Don't reveal whether email exists in system
      return res.json({ message: 'If this email exists in our system, you will receive a reset link' });
    }

    const user = results[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiration

    await pool.promise().query(
      'INSERT INTO login_tokens (_id, role, token, expires_at) VALUES (?, ?, ?, ?)',
      [user.id, 'vendor', resetToken, expiresAt]
    );

    const resetUrl = `${process.env.CUSTOMER_FRONTEND_URLS}/vendor/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"${process.env.EMAIL_SENDER_NAME}" <${process.env.EMAIL_FROM}>`,
      to: user.userEmail,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Hi ${user.userFirstname} ${user.userLastname},</h2>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all;">${resetUrl}</p>
          <p>This link will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>${process.env.EMAIL_SENDER_NAME}</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'If this email exists in our system, you will receive a reset link' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.validateResetToken = async (req, res) => {
    try {
        const { token } = req.query;
        console.log("forgottoken", token);

        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        const [results] = await pool.promise().query(
            'SELECT _id FROM login_tokens WHERE token = ? AND expires_at > NOW()',
            [token]
        );

        if (results.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        res.json({ valid: true, userId: results[0]._id });
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
      'SELECT _id FROM login_tokens WHERE token = ? AND expires_at > NOW()',
      [token]
    );

    if (results.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const userId = results[0]._id;

    // Hash the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in vendors table
    await pool.promise().query(
      'UPDATE vendors SET password = ? WHERE id = ?',
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

exports.logout = (req, res) => {
    res.clearCookie('Ven-Au-To', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/', // MUST match the login cookie path
    });

    res.status(200).json({ message: 'Logged out successfully' });
};
