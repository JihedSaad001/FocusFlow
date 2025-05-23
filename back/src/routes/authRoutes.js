const express = require("express")
const multer = require("multer")
const { authenticateJWT, isAdmin } = require("../middleware/authMiddleware")
const authController = require("../controllers/authController")

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

// Register a new user and send verification email
router.post("/signup", authController.signup)

// Verify user email with token
router.get("/verify-email/:token", authController.verifyEmail)

// Resend verification email
router.post("/resend-verification", authController.resendVerification)

// Request password reset email
router.post("/forgot-password", authController.forgotPassword)

// Reset password with token
router.post("/reset-password/:token", authController.resetPassword)

// Authenticate user and get token
router.post("/login", authController.login)

// Update user details
router.put("/update-user", authenticateJWT, authController.updateUser)

// Upload user profile picture
router.post("/upload-profile-pic", authenticateJWT, upload.single("file"), authController.uploadProfilePic)



// Admin login
router.post("/admin-login", authController.adminLogin)

module.exports = router

