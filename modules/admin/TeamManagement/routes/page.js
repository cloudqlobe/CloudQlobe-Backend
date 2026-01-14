const express = require("express");
const router = express.Router();

const TeamManagement = require("../controller/teamManagementController");

// Import attendance controller using CommonJS
const {
  punchIn,
  punchOut,
  getTodayAttendance,
  getMonthlyAttendance,
} = require("../controller/attendanceController");

// ------------------ Task Routes ------------------
router.post("/createmembertask", TeamManagement.createMemberTask);
router.get("/member-tasks", TeamManagement.getMemberTasks);
router.put("/member-tasks/:id", TeamManagement.updateMemberTask);
router.delete("/member-tasks/:id", TeamManagement.deleteMemberTask);
router.get("/sale-members", TeamManagement.getSaleMembers);
router.put("/member-tasks/:taskId/check", TeamManagement.checkTaskStatus);
router.delete("/member-tasks/:taskId/confirm", TeamManagement.confirmAndRemoveTask);

// ------------------ Attendance Routes ------------------
router.post("/punch-in", punchIn);
router.post("/punch-out", punchOut);
router.get("/today/:userId", getTodayAttendance);
router.get("/monthly/:userId/:month", getMonthlyAttendance);

// Export router
module.exports = router;
