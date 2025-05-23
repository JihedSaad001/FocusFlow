const express = require("express")
const { authenticateJWT, isAdmin } = require("../middleware/authMiddleware")
const resourceController = require("../controllers/resourceController")
const multer = require("multer")
const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })



// Get all active wallpapers
router.get("/wallpapers", resourceController.getWallpapers)

// Get all wallpapers including inactive ones (admin only)
router.get("/admin/wallpapers", authenticateJWT, isAdmin, resourceController.getAllWallpapers)

// Get all active ambient sounds
router.get("/ambient-sounds", resourceController.getAmbientSounds)

// Get all ambient sounds including inactive ones (admin only)
router.get("/admin/ambient-sounds", authenticateJWT, isAdmin, resourceController.getAllAmbientSounds)



// Upload a new wallpaper to storage (admin only)
router.post("/upload-wallpaper", authenticateJWT, isAdmin, upload.single("file"), resourceController.uploadWallpaper)

// Upload a new ambient sound to storage (admin only)
router.post("/upload-audio", authenticateJWT, isAdmin, upload.single("file"), resourceController.uploadAudio)

// Delete a resource by ID (admin only)
router.delete("/:id", authenticateJWT, isAdmin, resourceController.deleteResource)

// Toggle a resource's active status (admin only)
router.patch("/:id/toggle-status", authenticateJWT, isAdmin, resourceController.toggleResourceStatus)

// Get all active music tracks
router.get("/music", resourceController.getMusic)

// Get all music tracks including inactive ones (admin only)
router.get("/admin/music", authenticateJWT, isAdmin, resourceController.getAllMusic)

// Upload a new music track to storage (admin only)
router.post("/upload-music", authenticateJWT, isAdmin, upload.single("file"), resourceController.uploadMusic)
module.exports = router

