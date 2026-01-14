const pool = require("../../../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require('nodemailer');

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
async function sendVerificationEmail(email, token,name) {
    const mailOptions = {
        from: `${process.env.EMAIL}`,
        to: email,
        subject: 'Your Verification Token',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Hi ${name},</h2>
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

  exports.MemberLogin = async (req, res) => {
    try {
      const { username, password, selectDepartment } = req.body;
      console.log(req.body);
      
      const [rows] = await pool.promise().query(`SELECT * FROM ${selectDepartment} WHERE email = ?`, [username]);

      console.log(rows.length);

      if (rows.length === 0) {
        return res.status(404).json({ message: "Member not found" });
      }

      const member = rows[0];
      console.log(member);

      // Check if the department matches the role
      if (selectDepartment !== member.role) {
        return res.status(404).json({ message: "Member not found" });
      }

      // Compare passwords
      const isPasswordMatch = await bcrypt.compare(password, member.password);
      if (!isPasswordMatch) {
        return res.status(401).json({ message: "Invalid password" });
      }

      // Generate 6-digit token
      const token = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiration

      // Store token in database
      await pool.promise().query(
        "INSERT INTO login_tokens (_id, role, token, expires_at) VALUES (?, ?, ?, ?)",
        [member.id, selectDepartment, token, expiresAt]
      );

      // In a real app, you would send this token via email/SMS
      // await sendVerificationEmail(username, token, member.fullName);

      console.log(`Token for ${member.email}: ${token}`);

      return res.status(200).json({
        message: "Token sent to your email",
        memberId: member.id
      }); 

    } catch (error) { 
      console.error("Login error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };


  exports.verifyMemberToken = async (req, res) => {
    try {
      const { token, memberId, department } = req.body;
      console.log("token", req.body);

      if (!token || !memberId) {
        return res.status(400).json({ message: "Token and member ID are required" });
      }

      // Fetch token from DB for the given member
      const [tokenRows] = await pool.promise().query(
        "SELECT * FROM login_tokens WHERE _id = ? AND token = ?",
        [memberId, token]
      );

      console.log(tokenRows);

      if (tokenRows.length === 0) {
        return res.status(401).json({ message: "Invalid or already used token" });
      }

      const tokenEntry = tokenRows[0];
      const now = new Date();

      // Token expired
      if (now > new Date(tokenEntry.expires_at)) {
        await pool.promise().query("DELETE FROM login_tokens WHERE token_id = ?", [tokenEntry.id]);
        return res.status(410).json({ message: "Token expired" });
      }

      // Delete token after verification
      await pool.promise().query("DELETE FROM login_tokens WHERE token_id = ?", [tokenEntry.id]);

      // Fetch member info
      const [memberRows] = await pool.promise().query(
        `SELECT * FROM ${department} WHERE id = ?`,
        [memberId]
      );

      if (memberRows.length === 0) {
        return res.status(404).json({ message: "Member not found" });
      }

      const member = memberRows[0];

      // Create JWT
      const sessionToken = jwt.sign(
        {
          id: member.id,
          username: member.email,
          name: member.fullName,
          role: department
        },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      // Set cookie
      res.cookie("MemberAuthToken", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000,
      });

      // Send member data
      return res.status(200).json({
        message: "Token verified. Member authenticated.",
        memberData: sessionToken,
      });

    } catch (error) {
      console.error("Member token verification error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };


  exports.logout = (req, res) => {

    res.clearCookie('MemberAuthToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/', // MUST match the login cookie path
    });

    res.status(200).json({ message: 'Logged out successfully' });
  };