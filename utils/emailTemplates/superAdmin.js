// utils/emailTemplates.js

/**
 * Admin Welcome Email Template
 * @param {string} name - Admin full name
 * @param {string} email - Admin email (username)
 * @param {string} password - Admin password (temporary or set at creation)
 * @param {string} role - Admin role
 */
const adminWelcomeTemplate = (name, email, password, role) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #333;">Hello ${name},</h2>
    <p>Welcome to <b>CloudQlobe CRM</b> 🎉</p>
    <p>Your Admin account has been successfully created. Here are your login credentials:</p>
    <ul style="background:#f9f9f9; padding: 15px; border-radius: 8px; list-style: none;">
      <li><b>Username (Email):</b> ${email}</li>
      <li><b>Password:</b> ${password}</li>
      <li><b>Role:</b> ${role}</li>
    </ul>
    <p>Please log in and change your password immediately for security purposes.</p>
    <p>If you did not expect this account, please contact our support team immediately.</p>
    <br/>
    <p>Best regards,</p>
    <p><b>CloudQlobe Team</b></p>
  </div>
`;

const forgotPasswordTemplate = (name, resetUrl, minutes = 10) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #333;">Hi ${name},</h2>
    <p>You requested a password reset for your SuperAdmin account. Click the link below to reset your password:</p>
    <div style="text-align: center; margin: 20px 0;">
      <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Reset Password
      </a>
    </div>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all;">${resetUrl}</p>
    <p>This link will expire in ${minutes} minutes.</p>
    <p>If you didn't request this, please ignore this email.</p>
    <p>Best regards,<br>${process.env.EMAIL_SENDER_NAME || "CloudQlobe Team"}</p>
  </div>
`;

const superAdminLoginTemplate = (name, token, minutes = 3) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background: #f9f9f9;">
    <h2 style="color: #2E86C1; text-align:center;">🔐 SuperAdmin Login Verification</h2>
    <p>Hi <b>${name}</b>,</p>
    <p>Use the following login token to complete your CRM authentication:</p>
    <div style="text-align: center; margin: 20px 0;">
      <h1 style="background:#2E86C1; color:white; padding:15px 30px; display:inline-block; border-radius:8px; letter-spacing:5px;">
        ${token}
      </h1>
    </div>
    <p style="font-size: 15px;">⚠️ This token is valid for the next <b>${minutes} minutes</b>. Please keep it confidential and do not share it with anyone.</p>
    <p>If you did not request this login, kindly ignore this email or contact our support team immediately.</p>
    <br/>
    <p style="color: #555;">Best regards,<br/><b>${process.env.EMAIL_SENDER_NAME || "CloudQlobe Team"}</b></p>
  </div>
`;

module.exports = {
    adminWelcomeTemplate,
    forgotPasswordTemplate,
    superAdminLoginTemplate,

};
