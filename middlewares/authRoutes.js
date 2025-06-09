// authRoutes.js
const express = require('express');
const router = express.Router();
const { customerAuth, adminAuth } = require('../middlewares/authMiddleware');

// Customer auth check
router.get('/user/auth/check', customerAuth, (req, res) => {
    
  res.json({ 
    success: true,
    message: "Customer authenticated",
    user: req.user 
  });
});
 
// Admin auth check
router.get('/admin/auth/check', adminAuth, (req, res) => {

  res.json({ 
    success: true,
    message: "Admin authenticated",
    user: req.user 
  });
});

module.exports = router;