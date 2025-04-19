const express = require("express")
const multer = require("multer")
const { authenticateJWT, isAdmin } = require("../middleware/authMiddleware")
const authController = require("../controllers/authController")

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user and send verification email
 * @access  Public
 */
router.post("/signup", authController.signup)

/**
 * @route   GET /api/auth/verify-email/:token
 * @desc    Verify user email with token
 * @access  Public
 */
router.get("/verify-email/:token", authController.verifyEmail)

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend verification email
 * @access  Public
 */
router.post("/resend-verification", authController.resendVerification)

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
router.post("/forgot-password", authController.forgotPassword)

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Reset password with token
 * @access  Public
 */
router.post("/reset-password/:token", authController.resetPassword)

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post("/login", authController.login)

// Update user details
router.put("/update-user", authenticateJWT, authController.updateUser)

router.post("/upload-profile-pic", authenticateJWT, upload.single("file"), authController.uploadProfilePic)

router.post("/google-login", authController.googleLogin)

router.post("/refresh-token", authController.refreshToken)

router.post("/admin-login", authController.adminLogin)

module.exports = router

