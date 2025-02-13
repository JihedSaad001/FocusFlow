const express = require("express");
const Resource = require("../models/Resource");

const { authenticateJWT, isAdmin } = require("../middleware/authMiddleware"); 

const multer = require("multer");
const { supabase } = require("../config/supabase");


const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Store files in memory before upload

// Create a new resource (Admin Only)
router.post("/add", authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { type, name, url } = req.body;
    if (!type || !name || !url) return res.status(400).json({ message: "All fields are required" });

    const newResource = new Resource({ type, name, url, uploadedBy: req.user.id });
    await newResource.save();

    res.status(201).json({ message: "Resource added successfully", resource: newResource });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get all resources
router.get("/", async (req, res) => {
  try {
    const resources = await Resource.find();
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete a resource (Admin Only)
router.delete("/:id", authenticateJWT, isAdmin, async (req, res) => {
  try {
    const deletedResource = await Resource.findByIdAndDelete(req.params.id);
    if (!deletedResource) return res.status(404).json({ message: "Resource not found" });

    res.json({ message: "Resource deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
router.post("/upload", authenticateJWT, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const fileName = `${Date.now()}-${req.file.originalname}`;

    const { data, error } = await supabase.storage
      .from("profile-pictures") // Ensure this matches your bucket name
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: "3600",
      });

    if (error) throw error;

    // Get the public URL of the uploaded image
    const { publicURL } = supabase.storage
      .from("profile-pictures")
      .getPublicUrl(fileName);

    // ✅ Update the user profile in MongoDB with the new profile picture URL
    await User.findByIdAndUpdate(req.user.id, { profilePic: publicURL });

    res.status(200).json({ message: "Profile picture updated successfully", url: publicURL });
  } catch (error) {
    res.status(500).json({ message: "Upload error", error: error.message });
  }
});

  
module.exports = router;
