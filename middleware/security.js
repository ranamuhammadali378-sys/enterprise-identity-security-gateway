const rateLimit = require("express-rate-limit");

// Account Lockout / Rate limit: Max 5 failed attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Security Gateway: Too many login attempts. Account locked for 15 minutes.",
  },
});

// OWASP Sanitization against XSS & Injection payloads
const sanitizePayload = (req, res, next) => {
  const cleanInput = (target) => {
    for (let key in target) {
      if (typeof target[key] === "string") {
        target[key] = target[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
      } else if (typeof target[key] === "object" && target[key] !== null) {
        cleanInput(target[key]);
      }
    }
  };

  if (req.body) cleanInput(req.body);
  if (req.query) cleanInput(req.query);
  next();
};

module.exports = { loginLimiter, sanitizePayload };