const JWT = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Generic authentication middleware
 * @param {Array} allowedRoles - Array of roles allowed to access the route
 */
const auth = (allowedRoles = ['customer']) => {
  return (req, res, next) => {
    try {
      let tokenName = 'authToken'; // ✅ guest + customer use same token

      if (allowedRoles.includes('superAdmin')) {
        tokenName = 'SuperAdminAuthToken';
      } else if (
        allowedRoles.includes('admin') ||
        allowedRoles.some(role =>
          ['sale', 'lead', 'carrier', 'account', 'support'].includes(role)
        )
      ) {
        tokenName = 'AdminAuthToken';
      } else if (
        allowedRoles.some(role =>
          ['salemember', 'leadmember', 'accountmember', 'supportmember', 'carriermember'].includes(role)
        )
      ) {
        tokenName = 'MemberAuthToken';
      }

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

      const decoded = JWT.verify(token, JWT_SECRET);

      // ✅ Allow guest also
      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied`,
          data: decoded
        });
      }

      req.user = decoded;
      req.token = token;
      req.tokenName = tokenName;
      next();

    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token"
      });
    }
  };
};


// ✅ Specific role middlewares
const guestAuth = auth(['guest']);
const customerAuth = auth(['customer']);
const adminAuth = auth(['sale', 'carrier','lead', 'account', 'support']);
const superAdminAuth = auth(['superAdmin']);
const memberAuth = auth(['salemember', 'carriermember', 'leadmember', 'accountmember', 'supportmember']);

module.exports = {
  customerAuth,
  adminAuth,
  superAdminAuth,
  memberAuth,
  guestAuth,
  auth
};

