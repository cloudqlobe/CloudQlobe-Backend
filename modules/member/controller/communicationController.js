const pool = require('../../../config/db');

exports.getAllCustomerEnquiry = async (req, res) => {
  const query = "SELECT * FROM enquiry";
  try {
    const [results] = await pool.promise().query(query);
    res.status(200).json({ enquirys: results })
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAllCustomerDidNumber = async (req, res) => {
  const query = "SELECT * FROM didnumber";
  try {
    const [results] = await pool.promise().query(query);
    res.status(200).json({ didnumbers: results })
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


exports.updateEnquiry = async (req, res) => {
  const { id } = req.params;
  const { serviceEngineer } = req.body;
  console.log("updateEnquiry", id, serviceEngineer);

  const updateTest = `UPDATE enquiry SET serviceEngineer = ? WHERE id = ?`
  try {
    await pool.promise().query(updateTest, [serviceEngineer, id])
    res.status(200).json()

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateMemberEnquiryId = async (req, res) => {
  const { enquiryId } = req.body;
  const { id } = req.params;

  const fetchQuery = "SELECT enquiry_ids FROM lead_members WHERE id = ?";
  const updateQuery = "UPDATE lead_members SET enquiry_ids = ? WHERE id = ?";

  try {
    const [rows] = await pool.promise().query(fetchQuery, [id]);
    let existingRates = rows.length > 0 && rows[0].enquiry_ids ? JSON.parse(rows[0].enquiry_ids) : [];

    if (!Array.isArray(existingRates)) {
      existingRates = [];
    }

    // Append the new rate structure
    existingRates.push({ enquiryId });

    // Convert back to JSON and update the database
    await pool.promise().query(updateQuery, [JSON.stringify(existingRates), id]);

    console.log("Updated enquiryId:", existingRates);
    res.json({ success: true, message: "test pickup successfully." })
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateDID = async (req, res) => {
  const { id } = req.params;
  const { serviceEngineer } = req.body;
  console.log("updateEnquiry", id, serviceEngineer);

  const updateDid = `UPDATE didnumber SET serviceEngineer = ? WHERE id = ?`
  try {
    await pool.promise().query(updateDid, [serviceEngineer, id])
    res.status(200).json()

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateMemberDIDId = async (req, res) => {
  const { didId } = req.body;
  const { id } = req.params;
  console.log("updateMemberEnquiryId", didId, id);

  const fetchQuery = "SELECT did_enquirie_ids FROM lead_members WHERE id = ?";
  const updateQuery = "UPDATE lead_members SET did_enquirie_ids = ? WHERE id = ?";

  try {
    const [rows] = await pool.promise().query(fetchQuery, [id]);
    let existingRates = rows.length > 0 && rows[0].did_enquirie_ids ? JSON.parse(rows[0].did_enquirie_ids) : [];

    if (!Array.isArray(existingRates)) {
      existingRates = [];
    }

    // Append the new rate structure
    existingRates.push({ didId });

    // Convert back to JSON and update the database
    await pool.promise().query(updateQuery, [JSON.stringify(existingRates), id]);

    console.log("Updated enquiryId:", existingRates);
    res.json({ success: true, message: "test pickup successfully." })
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateEnquiryStatus = async (req, res) => {
  const { id } = req.params;
  const { newStatus } = req.body;
  console.log(id, newStatus);

  const updateTest = `UPDATE enquiry SET status = ? WHERE id = ?`
  try {
    const results = await pool.promise().query(updateTest, [newStatus, id])
    res.status(200).json()
    console.log(results);

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateDIDStatus = async (req, res) => {
  const { id } = req.params;
  const { newStatus } = req.body;
  console.log(id, newStatus);

  const updateTest = `UPDATE didnumber SET status = ? WHERE id = ?`
  try {
    const results = await pool.promise().query(updateTest, [newStatus, id])
    res.status(200).json()
    console.log(results);

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
};