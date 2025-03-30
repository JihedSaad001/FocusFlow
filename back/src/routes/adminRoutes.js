const express = require("express");
const User = require("../models/User");
const { authenticateJWT, isAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Get All Users (Admin Only)
router.get("/users", authenticateJWT, isAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: "user" });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
});



module.exports = router;
