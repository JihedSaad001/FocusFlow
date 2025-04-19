const express = require("express")
const { authenticateJWT, isAdmin } = require("../middleware/authMiddleware")
const resourceController = require("../controllers/resourceController")
const multer = require("multer")
const { supabase } = require("../config/supabase")

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

/**
 * @route   POST /api/resources/add
 * @desc    Manually add a new resource (Admin Only)
 * @access  Private (Admin)
 */
router.post("/add", authenticateJWT, isAdmin, resourceController.addResource)

/**
 * @route   GET /api/resources/wallpapers
 * @desc    Fetch all active wallpapers
 * @access  Public
 */
router.get("/wallpapers", resourceController.getWallpapers)

/**
 * @route   GET /api/resources/ambient-sounds
 * @desc    Fetch all active ambient sounds
 * @access  Public
 */
router.get("/ambient-sounds", resourceController.getAmbientSounds)

/**
 * @route   GET /api/resources/wallpapers/:id
 * @desc    Fetch a single wallpaper by ID
 * @access  Public
 */
router.get("/wallpapers/:id", resourceController.getWallpaperById)

/**
 * @route   POST /api/resources/upload-wallpaper
 * @desc    Admin uploads a wallpaper to Supabase
 * @access  Private (Admin)
 */
router.post("/upload-wallpaper", authenticateJWT, isAdmin, upload.single("file"), resourceController.uploadWallpaper)

/**
 * @route   POST /api/resources/upload-audio
 * @desc    Admin uploads an audio file to Supabase
 * @access  Private (Admin)
 */
router.post("/upload-audio", authenticateJWT, isAdmin, upload.single("file"), resourceController.uploadAudio)

/**
 * @route   DELETE /api/resources/:id
 * @desc    Delete a resource (Admin Only)
 * @access  Private (Admin)
 */
router.delete("/:id", authenticateJWT, isAdmin, resourceController.deleteResource)
/**
 * @route   GET /api/resources/music
 * @desc    Fetch all active music tracks
 * @access  Public
 */
router.get("/music", resourceController.getMusic);
/**
 * @route   POST /api/resources/upload-music
 * @desc    Admin uploads a music file to Supabase
 * @access  Private (Admin)
 */
router.post("/upload-music", authenticateJWT, isAdmin, upload.single("file"), resourceController.uploadMusic);
module.exports = router

