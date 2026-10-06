require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const path = require("path");

// Import Middlewares & Routes
const { sanitizePayload } = require("./middleware/security");
const authRoutes = require("./routes/auth");
const oauthRoutes = require("./routes/oauth");
const userRoutes = require("./routes/users");

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5000",
    credentials: true,
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(sanitizePayload); // OWASP Sanitizer

// General Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});
app.use(generalLimiter);

// Serve Frontend Static Files
app.use(express.static(path.join(__dirname, "public")));

// System Endpoints
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Enterprise Identity Gateway is running",
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/api/v1", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Enterprise Identity Security Gateway API v1",
    version: "1.0.0",
  });
});

// Mount Application Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/auth", oauthRoutes);
app.use("/api/v1", userRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Start Server
app.listen(PORT, () => {
  console.log("==========================================");
  console.log(" Enterprise Identity Security Gateway");
  console.log("==========================================");
  console.log(`Server running on: http://localhost:${PORT}`);
  console.log(`Health check:     http://localhost:${PORT}/health`);
  console.log(`API Base:         http://localhost:${PORT}/api/v1`);
  console.log("==========================================");
});