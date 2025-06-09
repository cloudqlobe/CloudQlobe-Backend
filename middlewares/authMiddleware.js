const JWT = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

const auth = (allowedRoles = ['user']) => {
  
  return (req, res, next) => {
    try {
      const tokenName = allowedRoles.includes('admin') || allowedRoles.includes('superAdmin') || allowedRoles.includes('saleMember') || allowedRoles.includes('sale') 
        ? 'Token' 
        : 'authToken';
      
      const token = req.cookies?.[tokenName] || req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({ 
          success: false,
          message: "Authentication required",
        });
      }

      const decoded = JWT.verify(token, JWT_SECRET);

      // ✅ Check if user has one of the allowed roles
      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ 
          success: false,
          message: `Access denied: Requires one of these roles - ${allowedRoles.join(', ')}` ,
          data: decoded
        });
      }

      req.user = decoded;
      next();

    } catch (error) {
      console.log("Token verification failed:", error.message);
      return res.status(401).json({ 
        success: false,
        message: "Invalid or expired token" 
      });
    }
  };
};

// Specific role middlewares
const customerAuth = auth(['user']);
const adminAuth = auth(['admin', 'superAdmin', 'saleMember', 'sale']);
const superAdminAuth = auth(['superAdmin']);
const saleMemberAuth = auth(['saleMember']);
const saleAuth = auth(['sale']);

module.exports = {
  customerAuth,
  adminAuth,
  superAdminAuth,
  saleMemberAuth,
  saleAuth,
  auth // The generic version that can accept any roles
};