// RBAC Middleware to check allowed roles
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access Denied. Required role: [${allowedRoles.join(", ")}]`,
      });
    }
    next();
  };
};

module.exports = { checkRole };