const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../../../config/db");

exports.createGuestAccount = async (req, res) => {
  const { customerId, password } = req.body;

  if (!customerId || !password) {
    return res.status(400).json({ message: "Customer ID and password required" });
  }

  try {
    // Check if guest already exists
    const [exists] = await pool
      .promise()
      .query(
        "SELECT id FROM guest_accounts WHERE customerId = ?",
        [customerId]
      );

    if (exists.length > 0) {
      return res.status(409).json({ message: "Guest account already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Let DB generate UUID
    await pool.promise().query(
      `INSERT INTO guest_accounts (customerId, password, accountType)
       VALUES (?, ?, 'guest')`,
      [customerId, hashedPassword]
    );

    res.status(201).json({
      message: "Guest account created successfully",
    });
  } catch (error) {
    console.error("Create guest error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


exports.guestLogin = async (req, res) => {
  const { customerId, password } = req.body;

  if (!customerId || !password) {
    return res.status(400).json({ message: "Customer ID and password required" });
  }

  try {
    const [rows] = await pool
      .promise()
      .query(
        "SELECT * FROM guest_accounts WHERE customerId = ?",
        [customerId]
      );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid guest credentials" });
    }

    const guest = rows[0];

    // 🚫 BLOCK CHECK
    if (guest.status === "blocked") {
      return res
        .status(403)
        .json({ message: "This guest account is blocked" });
    }

    const isMatch = await bcrypt.compare(password, guest.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid guest credentials" });
    }

    const token = jwt.sign(
      {
        id: guest.id,
        customerId: guest.customerId,
        role: "guest",
        accountType: guest.accountType,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("GuestAuthToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Guest login successful",
      role: "guest",
      token
    });
  } catch (error) {
    console.error("Guest login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.listGuests = async (req, res) => {
  try {
    const [rows] = await pool.promise().query(
      "SELECT id, customerId, status, created_at FROM guest_accounts ORDER BY created_at DESC"
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch guests" });
  }
};


exports.updateGuest = async (req, res) => {
  const { id } = req.params;
  const { customerId, password } = req.body;

  try {
    let query = "UPDATE guest_accounts SET customerId = ?";
    const values = [customerId];

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      query += ", password = ?";
      values.push(hashed);
    }

    query += " WHERE id = ?";
    values.push(id);

    await pool.promise().query(query, values);

    res.json({ message: "Guest updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  }
};

exports.toggleGuestStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // active | blocked

  if (!["active", "blocked"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    await pool.promise().query(
      "UPDATE guest_accounts SET status = ? WHERE id = ?",
      [status, id]
    );

    res.json({ message: `Guest account ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Status update failed" });
  }
};
