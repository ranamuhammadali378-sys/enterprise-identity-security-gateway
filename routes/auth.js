const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { sendTokens } = require("../services/tokenService");
const { loginLimiter } = require("../middleware/security");

const router = express.Router();

// Register: Local Auth with Bcrypt Hashing
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const assignedRole = ["Employee", "Manager", "SuperAdmin"].includes(role) ? role : "Employee";
    const existing = await db.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: "Email is already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
      [name, email, passwordHash, assignedRole]
    );

    return sendTokens(res, result.rows[0], 201);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Login: With Rate Limiter
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    return sendTokens(res, user, 200);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Refresh Token Rotation
router.post("/refresh", async (req, res) => {
  const oldRefreshToken = req.cookies?.refreshToken;
  if (!oldRefreshToken) {
    return res.status(401).json({ success: false, message: "No refresh token found." });
  }

  try {
    const tokenRecord = await db.query("SELECT * FROM refresh_tokens WHERE token = $1", [oldRefreshToken]);
    if (tokenRecord.rows.length === 0) {
      return res.status(403).json({ success: false, message: "Invalid or reused token." });
    }

    // Old token delete karein (Rotation requirement)
    await db.query("DELETE FROM refresh_tokens WHERE token = $1", [oldRefreshToken]);

    jwt.verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
      if (err) return res.status(403).json({ success: false, message: "Expired refresh token." });

      const userResult = await db.query("SELECT id, name, email, role FROM users WHERE id = $1", [decoded.id]);
      if (userResult.rows.length === 0) return res.status(404).json({ success: false, message: "User not found." });

      return sendTokens(res, userResult.rows[0], 200);
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Logout: Token Revocation
router.post("/logout", async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    await db.query("DELETE FROM refresh_tokens WHERE token = $1", [token]);
  }
  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
  return res.status(200).json({ success: true, message: "Logged out successfully." });
});

module.exports = router;