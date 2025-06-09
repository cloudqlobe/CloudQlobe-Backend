const pool = require('../../../config/db');


exports.getAllChatBotFaq = async (req, res) => {
    const query = "SELECT * FROM chatbot_faq";
    try {
      const [results] = await pool.promise().query(query);
      res.status(200).json({ success: true, chatbot_faq: results })
    } catch (error) {
      console.error("Database insert error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  exports.createChatBotMessage = async (req, res) => {
    console.log("create chatbot message");
    
    const query = "INSERT INTO chatbot_messages SET ?"
    try {
     const result = pool.promise().query(query,[req.body])
     res.status(201).json({message: "create message"})
    } catch (error) {
      console.error("Database insert error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  exports.getAllChatBotMessages = async (req, res) => {
    const query = "SELECT * FROM chatbot_messages";
    try {
      const [results] = await pool.promise().query(query);
      res.status(200).json({ success: true, chatbot_messages: results })
    } catch (error) {
      console.error("Database insert error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  // Update message status to delivered when received by client
exports.updateMessageStatus = async (req, res) => {
  const { customer_id, status } = req.body;
  
  const validStatuses = ['delivered', 'read', 'failed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const query = `
    UPDATE chatbot_messages 
    SET status = ? 
    WHERE customer_id = ?
  `;

  try {
    const [result] = await pool.promise().query(query, [status, customer_id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Message not found" });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Database update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};