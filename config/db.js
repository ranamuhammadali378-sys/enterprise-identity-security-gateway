const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

pool.on("connect", () => {
  console.log(" PostgreSQL Database Connected Successfully");
});

pool.on("error", (err) => {
  console.error("Database connection error:", err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};