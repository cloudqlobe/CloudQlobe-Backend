const db = require('../../../config/db');


exports.getAllMessage = (req, res) => {
  const sql = "SELECT * FROM messages ORDER BY timestamp ASC";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.getSalesMessage = (req, res) => {
  const sql = "SELECT * FROM messages WHERE chat_to = 'Sales' OR chat_from = 'Sales' ORDER BY timestamp ASC";

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.getCarriersMessage = (req, res) => {
  const sql = "SELECT * FROM messages WHERE chat_to = 'Carriers' OR chat_from = 'Carriers' ORDER BY timestamp ASC";

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.getLeadsMessage = (req, res) => {
  const sql = "SELECT * FROM messages WHERE chat_to = 'Marketing' OR chat_from = 'Marketing' ORDER BY timestamp ASC";

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.getAccountsMessage = (req, res) => {
  const sql = "SELECT * FROM messages WHERE chat_to = 'Accounts' OR chat_from = 'Accounts' ORDER BY timestamp ASC";

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.markAsRead = (req, res) => {
  const { id } = req.body;
  console.log("contactId", id);

  try {
    db.query("UPDATE messages SET read_status = 1 WHERE sender_id = ? OR receiver_id = ?", [id, id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error updating read status" });
  }
};


// Send a new message
exports.postMessage = (req, res) => {
  const { sender, sender_id, receiver, receiver_id, chat_from, chat_to, message } = req.body;
  console.log(req.body);

  // SQL query to insert the message into the database
  const sql = `
      INSERT INTO messages (sender, sender_id, receiver, receiver_id, chat_from, chat_to, message) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`;

  db.query(sql, [sender, sender_id, receiver, receiver_id, chat_from, chat_to, message], (err, result) => {
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
      timestamp: new Date()
    });
  });
};

exports.messageReply = (req, res) => {
  const { receiver, receiver_id, reply_of_message, reply_timestamp, message_id } = req.body;

  const sql = `
      UPDATE messages 
      SET reply_of_message = ?, reply_timestamp = ?, receiver = ?, receiver_id = ?
      WHERE id = ?`;

  db.query(sql, [reply_of_message, reply_timestamp, receiver, receiver_id, message_id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Message not found" });
    }

    res.json({
      message: "Reply added successfully",
      reply_of_message,
      reply_timestamp,
      receiver,
      receiver_id,
      message_id,
    });
  });
};

exports.deleteMessage = (req, res) => {
  const { id } = req.params;
  console.log(req.params);

  console.log("messageId", id);

  try {
    db.query("DELETE FROM messages WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error deleting message" });
  }
};