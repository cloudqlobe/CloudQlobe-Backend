const pool = require("../../../../config/db");

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



exports.getSpecificMemberTask = async (req, res) => {
  try {
const currentMemberId = req.params.memberId;

    const query = "SELECT * FROM membertasks";
    const [rows] = await pool.promise().query(query);

    const memberTasks = rows
      .map(task => {
        let members = [];
        try {
          members = JSON.parse(task.assignedToAll || "[]");
        } catch {}

        const currentMember = members.find(m => m.id == currentMemberId);
        if (!currentMember) return null;

        return {
          id: task.id,
          title: task.title,
          description: task.description,
          assignDate: task.assignDate,
          deadline: task.deadline,
          priority: task.priority,
          taskNumber: task.taskNumber,
          taskstatus: currentMember.taskstatus === "complte" ? "complete" : currentMember.taskstatus,
          solvedTaskNumber: currentMember.solvedTaskNumber || "0",
        };
      })
      .filter(Boolean);

    res.json(memberTasks);

  } catch (error) {
    console.error("Error fetching member tasks:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


exports.updateLeadTaskProgress = async (req, res) => {
  try {
    const { taskId, memberId } = req.params;

    const taskQuery = `
      SELECT title, taskNumber, assignedToAll, assignDate, deadline
      FROM membertasks
      WHERE id = ?`;
    const [taskRows] = await pool.promise().query(taskQuery, [taskId]);

    if (taskRows.length === 0)
      return res.status(404).json({ message: "Task not found" });

    const task = taskRows[0];
    const assignedToAll = JSON.parse(task.assignedToAll || "[]");

    const startDate = formatToMysql(task.assignDate);
    const endDate = formatToMysql(task.deadline);

    let solvedQuery = "";
    let queryParams = [];

    // ADD LEAD
    if (task.title === "Add Lead") {
      solvedQuery = `
        SELECT COUNT(*) AS solvedCount
        FROM customer
        WHERE memberId = ?
          AND createdAt BETWEEN ? AND ?`;
      queryParams = [memberId, startDate, endDate];
    }

    // CONVERT LEAD CLIENT
    else if (task.title === "Convert Lead Client") {
      solvedQuery = `
        SELECT COUNT(*) AS solvedCount
        FROM customer
        WHERE memberId = ?
          AND leadType = 'Customer'
          AND leadConvertTime BETWEEN ? AND ?`;
      queryParams = [memberId, startDate, endDate];
    }

    // CONVERT LEAD VENDOR
    else if (task.title === "Convert Lead Vendor") {
      solvedQuery = `
        SELECT COUNT(*) AS solvedCount
        FROM customer
        WHERE memberId = ?
          AND leadType = 'Carrier'
          AND leadConvertTime BETWEEN ? AND ?`;
      queryParams = [memberId, startDate, endDate];
    }

    const [result] = await pool.promise().query(solvedQuery, queryParams);
    const solved = result[0].solvedCount || 0;

    let memberStatus =
      solved === 0 ? "pending"
      : solved < task.taskNumber ? "progress"
      : "complete";

    // Update only this member
    const updatedAssignedToAll = assignedToAll.map(m =>
      m.id == memberId
        ? { ...m, solvedTaskNumber: solved, taskstatus: memberStatus }
        : m
    );

    await pool.promise().query(
      "UPDATE membertasks SET assignedToAll = ? WHERE id = ?",
      [JSON.stringify(updatedAssignedToAll), taskId]
    );

    res.json({
      message: "Member task updated",
      solved,
      memberStatus,
      assignedToAll: updatedAssignedToAll
    });

  } catch (err) {
    console.error("Error updating:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
