// utils/mailService.js
const transporter = require("./transporter");

/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML body
 * @param {string} [text] - Optional plain text body
 */
const sendGMail = async ({ to, subject, html, text }) => {
  try {
    await transporter.sendMail({
      from: `"${process.env.EMAIL_SENDER_NAME || "System"}" <${process.env.EMAIL}>`,
      to,
      subject,
      html,
      text,
    });
    console.log(`📩 Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    return false;
  }
};

module.exports = sendGMail;
