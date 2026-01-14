const pool = require("../../../../config/db");

// ------------------------------------------------------
// PUNCH IN
// ------------------------------------------------------
exports.punchIn = async (req, res) => {
  try {
    console.log(req.body);
    
    const { memberId } = req.body;

    // Check if today's attendance already exists
    const [row] = await pool.promise().query(
      "SELECT * FROM attendance WHERE memberId = ? AND date = CURDATE()",
      [memberId]
    );

    if (row.length > 0) {
      return res.json({
        success: false,
        message: "Already punched in today"
      });
    }

    const punchInTime = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });

    const [result] = await pool.promise().query(
      "INSERT INTO attendance (memberId, date, punchIn, status) VALUES (?, CURDATE(), ?, ?)",
      [memberId, punchInTime, "Present"]
    );

    res.json({
      success: true,
      record: {
        id: result.insertId,
        memberId,
        date: new Date().toISOString().split("T")[0],
        punchIn: punchInTime,
        punchOut: null,
        totalHours: "0h 0m",
        status: "Present"
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err });
  }
};


// ------------------------------------------------------
// PUNCH OUT
// ------------------------------------------------------
exports.punchOut = async (req, res) => {
  try {
    const { memberId } = req.body;

    const [rows] = await pool.promise().query(
      "SELECT * FROM attendance WHERE memberId = ? AND date = CURDATE()",
      [memberId]
    );

    const record = rows[0];
    if (!record) {
      return res.json({ success: false, message: "No punch-in found" });
    }

    const punchOutTime = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });

    // Calculate total hours
    const start = new Date(`1970-01-01T${convertTo24(record.punchIn)}:00`);
    const end = new Date(`1970-01-01T${convertTo24(punchOutTime)}:00`);
    const diffMs = end - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs / (1000 * 60)) % 60);
    const totalHours = `${hours}h ${mins}m`;

    await pool.promise().query(
      "UPDATE attendance SET punchOut = ?, totalHours = ? WHERE id = ?",
      [punchOutTime, totalHours, record.id]
    );

    res.json({
      success: true,
      record: {
        ...record,
        punchOut: punchOutTime,
        totalHours
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err });
  }
};

// Helper for time conversion
function convertTo24(time12h) {
  const [time, modifier] = time12h.split(" ");
  let [hours, minutes] = time.split(":");
  if (hours === "12") hours = "00";
  if (modifier === "PM") hours = parseInt(hours, 10) + 12;
  return `${hours}:${minutes}`;
}


// ------------------------------------------------------
// GET TODAY ATTENDANCE
// ------------------------------------------------------
exports.getTodayAttendance = async (req, res) => {
  try {
    const { memberId } = req.params;

    const [rows] = await pool.promise().query(
      "SELECT * FROM attendance WHERE memberId = ? AND date = CURDATE()",
      [memberId]
    );

    res.json({
      success: true,
      today: rows[0] || null
    });

  } catch (err) {
    res.status(500).json({ success: false });
  }
};


// ------------------------------------------------------
// GET MONTHLY ATTENDANCE
// ------------------------------------------------------

exports.getMonthlyAttendance = async (req, res) => {
  try {
    const { memberId, month } = req.params; 
    console.log(memberId,month);
    
    // month format: "2025-11"

    const startDate = `${month}-01`;
    const endDate = `${month}-31`; // Works for any month

    const [rows] = await pool.promise().query( 
      `SELECT * FROM attendance
       WHERE memberId = ?
       AND date BETWEEN ? AND ?
       ORDER BY date DESC`,
      [memberId, startDate, endDate]
    );

    res.json({
      success: true,
      records: rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

