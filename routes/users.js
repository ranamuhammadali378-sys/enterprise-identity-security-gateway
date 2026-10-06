const express = require("express");
const db = require("../config/db");
const { verifyJWT } = require("../middleware/auth");
const { checkRole } = require("../middleware/rbac");

const router = express.Router();

// 1. GET /api/v1/employee/profile -> All authenticated roles
router.get("/employee/profile", verifyJWT, async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Employee profile access granted.",
    user: req.user,
  });
});

// 2. POST /api/v1/payroll/approve -> Manager and SuperAdmin only
router.post("/payroll/approve", verifyJWT, checkRole(["Manager", "SuperAdmin"]), (req, res) => {
  res.status(200).json({
    success: true,
    message: `Payroll approved successfully by ${req.user.role}.`,
  });
});

// 3. DELETE /api/v1/users/:id -> SuperAdmin only
router.delete("/users/:id", verifyJWT, checkRole(["SuperAdmin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const deleteOp = await db.query("DELETE FROM users WHERE id = $1 RETURNING id", [id]);
    if (deleteOp.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    res.status(200).json({
      success: true,
      message: `User with ID ${id} deleted successfully by SuperAdmin.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;