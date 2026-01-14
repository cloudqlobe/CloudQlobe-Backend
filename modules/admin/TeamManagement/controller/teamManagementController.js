const pool = require("../../../../config/db");

exports.getSaleMembers = async (req, res) => {
  try {
    const query = "SELECT id, fullName, email FROM salemember WHERE status = 'active'";
    const [rows] = await pool.promise().query(query);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Get Members Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


exports.createMemberTask = async (req, res) => {
  try {
    const data = { ...req.body };

    // ✅ Convert assignedToAll array to JSON string
    if (Array.isArray(data.assignedToAll)) {
      data.assignedToAll = JSON.stringify(data.assignedToAll);
    }

    const query = "INSERT INTO membertasks SET ?";
    await pool.promise().query(query, data);

    res.status(201).json({ message: "Task added successfully" });
  } catch (error) {
    console.error("Database insert error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


exports.getMemberTasks = async (req, res) => {
  try {
    const query = "SELECT * FROM membertasks ORDER BY created_at DESC";
    const [rows] = await pool.promise().query(query);

    // ✅ Convert assignedToAll JSON → Array
    const formattedTasks = rows.map(task => ({
      ...task,
      assignedToAll: task.assignedToAll ? JSON.parse(task.assignedToAll) : []
    }));

    res.status(200).json(formattedTasks);
  } catch (error) {
    console.error("Database fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateMemberTask = async (req, res) => {
  try {
    const { id } = req.params; // task id comes from URL
    const data = { ...req.body };

    // Convert array → JSON string
    if (Array.isArray(data.assignedToAll)) {
      data.assignedToAll = JSON.stringify(data.assignedToAll);
    }

    const query = "UPDATE membertasks SET ? WHERE id = ?";
    await pool.promise().query(query, [data, id]);

    res.status(200).json({ message: "Task updated successfully" });
  } catch (error) {
    console.error("Database update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteMemberTask = async (req, res) => {
  try {
    const { id } = req.params;

    const query = "DELETE FROM membertasks WHERE id = ?";
    const [result] = await pool.promise().query(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Database delete error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

function formatToMysql(date) {
  const d = new Date(date);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}


exports.checkTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;

    const [taskRows] = await pool.promise().query(
      "SELECT * FROM membertasks WHERE id = ?",
      [taskId]
    );
    const task = taskRows[0];
    if (!task) return res.status(404).json({ message: "Task not found" });

    const assignedToAll = JSON.parse(task.assignedToAll);

    // Convert dates to MySQL format

    const assignDate = formatToMysql(task.assignDate);
    const deadline = formatToMysql(task.deadline);

    const startDate = assignDate
    const endDate = deadline

    for (let member of assignedToAll) {
      let solvedQuery = "";
      let queryParams = [];

      // ADD LEAD
      if (task.title === "Add Lead") {
        solvedQuery = `
          SELECT COUNT(*) AS solvedCount 
          FROM customer 
          WHERE memberId = ?
          AND createdAt BETWEEN ? AND ?`;
        queryParams = [member.id, startDate, endDate];
      }

      // CONVERT LEAD CLIENT
      else if (task.title === "Convert Lead Client") {
        solvedQuery = `
          SELECT COUNT(*) AS solvedCount 
          FROM customer 
          WHERE memberId = ?
          AND leadType = 'Customer'
          AND leadConvertTime BETWEEN ? AND ?`;
        queryParams = [member.id, startDate, endDate];
      }

      // CONVERT LEAD VENDOR
      else if (task.title === "Convert Lead Vendor") {
        solvedQuery = `
          SELECT COUNT(*) AS solvedCount 
          FROM customer 
          WHERE memberId = ?
          AND leadType = 'Carrier'
          AND leadConvertTime BETWEEN ? AND ?`;
        queryParams = [member.id, startDate, endDate];
      }

      // Execute query
      const [countResult] = await pool.promise().query(solvedQuery, queryParams);
      const solved = countResult[0].solvedCount || 0;

      member.solvedTaskNumber = solved;

      // POINT CALCULATION: extra solved tasks
      // if (solved > task.taskNumber) {
      //   member.points = solved - task.taskNumber;
      // } else {
      //   member.points = 0;
      // }

      if (solved === 0) member.taskstatus = "pending";
      else if (solved < task.taskNumber) member.taskstatus = "progress";
      else member.taskstatus = "complete";
    }

    // FINAL TASK STATUS
    const allComplete = assignedToAll.every(m => m.taskstatus === "complete");
    const someProgress = assignedToAll.some(m => m.taskstatus === "progress");

    let taskStatus = "pending";
    if (allComplete) taskStatus = "complete";
    else if (someProgress) taskStatus = "progress";

    // UPDATE DB
    await pool.promise().query(
      "UPDATE membertasks SET assignedToAll = ?, status = ? WHERE id = ?",
      [JSON.stringify(assignedToAll), taskStatus, taskId]
    );

    res.json({ ...task, assignedToAll, status: taskStatus });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error checking task" });
  }
};

exports.confirmAndRemoveTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    // 1) Fetch the main task
    const [taskRows] = await pool
      .promise()
      .query("SELECT * FROM membertasks WHERE id = ?", [taskId]);

    if (taskRows.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    const task = taskRows[0];
    const {
      title,
      assignDate,
      taskNumber,
      assignedToAll // longtext JSON
    } = task;

    // Convert assigned members list
    const allAssign = JSON.parse(assignedToAll);

    // 2) Loop through all members assigned
    for (const member of allAssign) {
      const memberId = member.id;
      const solved = member.solvedTaskNumber || 0;
      const totalTask = taskNumber;

      // --- Performance Points Logic ---
      let points = 0;
      if (solved === 0) points = -1;
      else if (solved > totalTask) points = 3;
      else if (solved == totalTask) points = 2;
      else if (solved > 0 && solved < totalTask) points = 1;

      // 3) Build performance detail text
      const detail = `
Title: ${title}
Assigned Date: ${assignDate}
Solved Task: ${solved}
Total Task: ${totalTask}
Given Points: ${points}
------------------------------
`;

      // 4) Fetch member existing points and details
      const [memberRows] = await pool
        .promise()
        .query("SELECT points, performancedetails FROM salemember WHERE id = ?", [
          memberId
        ]);

      if (memberRows.length === 0) continue;

      const oldPoints = memberRows[0].points || 0;
      const oldDetails = memberRows[0].performancedetails || "";

      // 5) Calculate final points
      let finalPoints = oldPoints + points;
      if (points === -1) finalPoints = oldPoints - 1; // negative rule

      // 6) Update member record
      await pool.promise().query(
        "UPDATE salemember SET points = ?, performancedetails = ? WHERE id = ?",
        [finalPoints, oldDetails + detail, memberId]
      );
    }

    // 7) Remove main task
    await pool.promise().query("DELETE FROM membertasks WHERE id = ?", [
      taskId
    ]);

    res.json({
      message: "Performance updated for all members & task removed"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error processing task" });
  }
};

