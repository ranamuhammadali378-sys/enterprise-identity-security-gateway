const jwt = require("jsonwebtoken");
const db = require("../config/db");

// Short-lived Access Token (15 mins)
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};

// Long-lived Refresh Token (7 days)
const generateRefreshToken = async (user) => {
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.query(
    "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
    [user.id, refreshToken, expiresAt]
  );

  return refreshToken;
};

// Send tokens & httpOnly cookie
const sendTokens = async (res, user, statusCode = 200) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(statusCode).json({
    success: true,
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

module.exports = { generateAccessToken, generateRefreshToken, sendTokens };