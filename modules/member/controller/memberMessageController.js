const db = require("../../../config/db");

/* ================= GET ALL MESSAGES ================= */
exports.getAllMessage = (req, res) => {
  const sql = `SELECT * FROM messages ORDER BY timestamp ASC`;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

/* ================= SALES ================= */
exports.getSalesMessage = (req, res) => {
  const sql = `
    SELECT * FROM messages
    WHERE chat_to = 'Sales' OR chat_from = 'Sales'
    ORDER BY timestamp ASC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

/* ================= CARRIERS ================= */
exports.getCarriersMessage = (req, res) => {
  const sql = `
    SELECT * FROM messages
    WHERE chat_to = 'Carriers' OR chat_from = 'Carriers'
    ORDER BY timestamp ASC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

/* ================= MARKETING ================= */
exports.getLeadsMessage = (req, res) => {
  const sql = `
    SELECT * FROM messages
    WHERE chat_to = 'Marketing' OR chat_from = 'Marketing'
    ORDER BY timestamp ASC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

/* ================= ACCOUNTS ================= */
exports.getAccountsMessage = (req, res) => {
  const sql = `
    SELECT * FROM messages
    WHERE chat_to = 'Accounts' OR chat_from = 'Accounts'
    ORDER BY timestamp ASC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

/* ================= MARK AS READ ================= */
exports.markAsRead = (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Sender/Receiver ID required" });
  }

  const sql = `
    UPDATE messages
    SET read_status = 1
    WHERE receiver_id = ?
  `;

  db.query(sql, [id], (err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to update read status" });
    }
    res.json({ success: true });
  });
};

/* ================= SEND MESSAGE ================= */
exports.postMessage = (req, res) => {
  const {
    sender,
    sender_id,
    receiver,
    receiver_id,
    chat_from,
    chat_to,
    message,
  } = req.body;

  if (!sender || !sender_id || !chat_from || !chat_to || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const sql = `
    INSERT INTO messages
    (sender, sender_id, receiver, receiver_id, chat_from, chat_to, message)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [sender, sender_id, receiver, receiver_id, chat_from, chat_to, message],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      res.status(201).json({
        id: result.insertId,
        sender,
        sender_id,
        receiver,
        receiver_id,
        chat_from,
        chat_to,
        message,
        read_status: 0,
        timestamp: new Date(),
      });
    }
  );
};

/* ================= DELETE MESSAGE ================= */
exports.deleteMessage = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "Message ID required" });
  }

  const sql = `DELETE FROM messages WHERE id = ?`;

  db.query(sql, [id], (err) => {
    if (err) {
      return res.status(500).json({ error: "Error deleting message" });
    }
    res.json({ success: true });
  });
};
