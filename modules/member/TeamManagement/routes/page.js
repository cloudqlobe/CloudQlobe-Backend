const express = require("express");
const router = express.Router();

const TeamManagement = require("../controller/teamManagementController");
const AttendanceManagement = require("../controller/attendanceController");

// ------------------ Task Routes ------------------
router.get('/tasks/:memberId', TeamManagement.getSpecificMemberTask);
router.put('/tasks/update-progress/:taskId/:memberId', TeamManagement.updateLeadTaskProgress);

// ------------------ Attendance Routes ------------------
router.post("/attendance/punch-in", AttendanceManagement.punchIn);
router.post("/attendance/punch-out", AttendanceManagement.punchOut);
router.get("/attendance/today/:memberId", AttendanceManagement.getTodayAttendance);
router.get("/attendance/monthly/:memberId/:month", AttendanceManagement.getMonthlyAttendance);

// Export router
module.exports = router;
