

const JWT = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Generic authentication middleware
 * @param {Array} allowedRoles - Array of roles allowed to access the route
 */
const auth = (allowedRoles = ['customer']) => {
  
  return (req, res, next) => {
    try {
      // Determine token name based on allowed roles
      let tokenName = 'authToken'; // Default for customers

      if (allowedRoles.includes('superAdmin')) {
        tokenName = 'SuperAdminAuthToken';
      }
      else if (allowedRoles.includes('vendor')) {
        tokenName = 'Ven-Au-To';
      }

      else if (allowedRoles.includes('admin') ||
        allowedRoles.some(role =>
          ['sale', 'lead', 'carrier', 'account', 'support'].includes(role)
        )) {
        tokenName = 'AdminAuthToken';
      } else if (
        allowedRoles.some(role =>
          ['saleMember', 'leadmember', 'accountmember', 'supportmember'].includes(role)
        )
      ) {
        tokenName = 'MemberAuthToken';
      }


      // Get token from cookies or Authorization header
      const token =
        req.cookies?.[tokenName] ||
        (req.headers.authorization?.startsWith('Bearer ')
          ? req.headers.authorization.split(' ')[1]
          : null);


      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // Verify token
      const decoded = JWT.verify(token, JWT_SECRET);

      // Check allowed roles
      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied: Requires one of these roles - ${allowedRoles.join(', ')}`,
          data: decoded
        });
      }

      // Attach user to request
      req.user = decoded;
      req.token = token;
      req.tokenName = tokenName
      next();

    } catch (error) {
      console.error("Token verification failed:", error.message);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token"
      });
    }
  };
};

// ✅ Specific role middlewares
const customerAuth = auth(['customer']);
const vendorAuth = auth(['vendor']);
const adminAuth = auth(['sale', 'carrier', 'lead', 'account', 'support']);
const superAdminAuth = auth(['superAdmin']);
const memberAuth = auth(['salemember', 'carriermember', 'leadmember', 'accountmember', 'supportmember']);

module.exports = {
  customerAuth,
  vendorAuth,
  adminAuth,
  superAdminAuth,
  memberAuth,
  auth
};
