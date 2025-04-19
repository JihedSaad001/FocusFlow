const express = require("express")
const router = express.Router()
const { authenticateJWT, isAdmin } = require("../middleware/authMiddleware")
const adminController = require("../controllers/adminController")

// Update user role
router.put("/users/:userId/role", authenticateJWT, isAdmin, adminController.updateUserRole)

// Get user statistics
router.get("/stats/users", authenticateJWT, isAdmin, adminController.getUserStats)

// Get project statistics
router.get("/stats/projects", authenticateJWT, isAdmin, adminController.getProjectStats)

// Get all users with project counts
router.get("/users", authenticateJWT, isAdmin, adminController.getUsers)

module.exports = router

