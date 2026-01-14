// authRoutes.js
const express = require('express');
const router = express.Router();
const { customerAuth, adminAuth, memberAuth, superAdminAuth, guestAuth } = require('../middlewares/authMiddleware');

// Guest auth check
router.get('/guest/auth/check', guestAuth, (req, res) => {
  res.json({
    success: true,
    message: "Guest authenticated",
    user: req.user,
    token: req.token,
    tokenName: req.tokenName
  });
});

// Customer auth check
router.get('/customer/auth/check', customerAuth, (req, res) => {
  res.json({
    success: true,
    message: "Customer authenticated",
    user: req.user,
    token: req.token,         // Send token back
    tokenName: req.tokenName  // Send token name back
  });
});

// Member auth check
router.get('/member/auth/check', memberAuth, (req, res) => {
  res.json({
    success: true,
    message: "Member authenticated",
    user: req.user,
    token: req.token,
    tokenName: req.tokenName
  });
});

// Admin auth check
router.get('/admin/auth/check', adminAuth, (req, res) => {
  res.json({
    success: true,
    message: "Admin authenticated",
    user: req.user,
    token: req.token,
    tokenName: req.tokenName
  });
});

// SuperAdmin auth check
router.get('/superAdmin/auth/check', superAdminAuth, (req, res) => {
  res.json({
    success: true,
    message: "Super Admin authenticated",
    user: req.user,
    token: req.token,
    tokenName: req.tokenName
  });
});


module.exports = router;