const express = require("express");
const Resource = require("../models/Resource");
const { authenticateJWT, isAdmin } = require("../middleware/authMiddleware");
const multer = require("multer");
const { supabase } = require("../config/supabase");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @route   POST /api/resources/add
 * @desc    Manually add a new resource (Admin Only)
 * @access  Private (Admin)
 */
router.post("/add", authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { type, name, url, category, tags } = req.body;
    if (!type || !name || !url) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newResource = new Resource({
      type,
      name,
      url,
      category,
      tags,
      uploadedBy: req.user.id,
    });

    await newResource.save();

    res.status(201).json({ message: "Resource added successfully", resource: newResource });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * @route   GET /api/resources/wallpapers
 * @desc    Fetch all active wallpapers
 * @access  Public
 */
router.get("/wallpapers", async (req, res) => {
  try {
    const wallpapers = await Resource.find({ type: "wallpaper", isActive: true });
    res.json(wallpapers);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * @route   GET /api/resources/wallpapers/:id
 * @desc    Fetch a single wallpaper by ID
 * @access  Public
 */
router.get("/wallpapers/:id", async (req, res) => {
  try {
    const wallpaper = await Resource.findById(req.params.id);
    if (!wallpaper) {
      return res.status(404).json({ message: "Wallpaper not found" });
    }
    res.json(wallpaper);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * @route   POST /api/resources/upload-wallpaper
 * @desc    Admin uploads a wallpaper to Supabase
 * @access  Private (Admin)
 */
router.post("/upload-wallpaper", authenticateJWT, isAdmin, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileName = `wallpapers/${Date.now()}-${req.file.originalname}`;

    // Upload image to Supabase Storage
    const { data, error } = await supabase.storage
      .from("wallpapers")
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: "3600",
      });

    if (error) throw error;

    // Retrieve the public URL
    const { data: publicUrlData } = supabase.storage
      .from("wallpapers")
      .getPublicUrl(fileName);

    if (!publicUrlData) {
      return res.status(500).json({ message: "Failed to get public URL from Supabase" });
    }

    const publicUrl = publicUrlData.publicUrl;

    // Save the wallpaper in MongoDB
    const newWallpaper = new Resource({
      type: "wallpaper",
      name: req.file.originalname,
      url: publicUrl,
      uploadedBy: req.user.id,
      category: req.body.category || "abstract", // Default category
      tags: req.body.tags ? req.body.tags.split(",") : [],
    });

    await newWallpaper.save();

    res.status(200).json({ message: "Wallpaper uploaded successfully", url: publicUrl, wallpaper: newWallpaper });
  } catch (error) {
    res.status(500).json({ message: "Upload error", error: error.message });
  }
});

/**
 * @route   DELETE /api/resources/:id
 * @desc    Delete a resource (Admin Only)
 * @access  Private (Admin)
 */
router.delete("/:id", authenticateJWT, isAdmin, async (req, res) => {
  try {
    const deletedResource = await Resource.findByIdAndDelete(req.params.id);
    if (!deletedResource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    res.json({ message: "Resource deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
