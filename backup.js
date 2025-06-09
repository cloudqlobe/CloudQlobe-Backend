const fs = require('fs');
const XLSX = require('xlsx');
const path = require('path');
const nodemailer = require('nodemailer');
const pool = require('./config/db');

async function backupEachTableToExcelAndEmail() {
  try {
    const connection = await pool.promise();

    // Step 1: Fetch all table names
    const [tables] = await connection.query("SHOW TABLES");
    const tableKey = Object.keys(tables[0])[0];

    const attachments = [];

    // Step 2: Loop through each table
    for (const table of tables) {
      const tableName = table[tableKey];

      // ❌ Skip 'login_tokens' table
      if (tableName === 'login_tokens') {
        console.log(`⏩ Skipped table: ${tableName}`);
        continue;
      }

      const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, tableName);

      // Generate Excel file in memory
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

      attachments.push({
        filename: `${tableName}.xlsx`,
        content: excelBuffer,
      });
    }

    // Step 3: Send Email with attachments
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      }
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: process.env.BACKUP_PASS_EMAIL,
      subject: `📦 All Table Backups - ${new Date().toISOString().split('T')[0]}`,
      text: `Attached are the backup Excel files for all tables (excluding 'login_tokens').`,
      attachments: attachments,
    };

    await transporter.sendMail(mailOptions);
    console.log('📧 Email sent with all table backups.');

  } catch (error) {
    console.error('❌ Backup or email error:', error);
  }
}

module.exports = backupEachTableToExcelAndEmail;
