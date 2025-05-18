const Resource = require("../models/Resource");
const { supabase } = require("../config/supabase");
const {
  validateFileFormat,
  validateMimeType,
  uploadFileToSupabase,
  saveResourceToDatabase
} = require("../utils/fileUpload");

/**
 * Manually add a new resource (Admin Only)
 */
exports.addResource = async (req, res) => {
  try {
    const { type, name, url, category, tags } = req.body;
    if (!type || !name || !url) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Prepare resource data for database
    const resourceData = {
      type,
      name,
      url,
      category,
      tags,
      uploadedBy: req.user.id,
    };

    // Save to database using our utility function
    const saveResult = await saveResourceToDatabase(resourceData);

    if (!saveResult.success) {
      return res.status(500).json({ message: saveResult.message });
    }

    res.status(201).json({
      message: "Resource added successfully",
      resource: saveResult.resource
    });
  } catch (error) {
    console.error("Error adding resource:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Fetch all active wallpapers
 */
exports.getWallpapers = async (_, res) => {
  try {
    const wallpapers = await Resource.find({ type: "wallpaper", isActive: true });
    res.json(wallpapers);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Fetch all wallpapers (both active and inactive) - Admin Only
 */
exports.getAllWallpapers = async (_, res) => {
  try {
    const wallpapers = await Resource.find({ type: "wallpaper" });
    res.json(wallpapers);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Fetch all active ambient sounds
 */
exports.getAmbientSounds = async (_, res) => {
  try {
    const sounds = await Resource.find({ type: "audio", isActive: true });
    res.json(sounds);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Fetch all ambient sounds (both active and inactive) - Admin Only
 */
exports.getAllAmbientSounds = async (_, res) => {
  try {
    const sounds = await Resource.find({ type: "audio" });
    res.json(sounds);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Fetch all active music tracks
 */
exports.getMusic = async (_, res) => {
  try {
    const music = await Resource.find({ type: "music", isActive: true });
    res.json(music);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Fetch all music tracks (both active and inactive) - Admin Only
 */
exports.getAllMusic = async (_, res) => {
  try {
    const music = await Resource.find({ type: "music" });
    res.json(music);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Fetch a single wallpaper by ID
 */
exports.getWallpaperById = async (req, res) => {
  try {
    const wallpaper = await Resource.findById(req.params.id);
    if (!wallpaper) {
      return res.status(404).json({ message: "Wallpaper not found" });
    }
    res.json(wallpaper);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Admin uploads a wallpaper to Supabase
 */
exports.uploadWallpaper = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Validate image format
    const validFormats = ["jpg", "jpeg", "png", "gif", "webp"];
    const formatValidation = validateFileFormat(req.file.originalname, validFormats);

    if (!formatValidation.valid) {
      return res.status(400).json({ message: formatValidation.message });
    }

    // Validate MIME type
    const validMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const mimeValidation = validateMimeType(req.file.mimetype, validMimeTypes);

    if (!mimeValidation.valid) {
      return res.status(400).json({ message: mimeValidation.message });
    }

    // Validate category
    const validCategories = ["nature", "abstract", "dark", "minimal"];
    const category = req.body.category || "abstract";
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: `Invalid category. Must be one of: ${validCategories.join(", ")}` });
    }

    // Upload file to Supabase
    const uploadResult = await uploadFileToSupabase(req.file, "wallpapers", "wallpapers");

    if (!uploadResult.success) {
      return res.status(500).json({ message: uploadResult.message });
    }

    // Prepare resource data for database
    const resourceData = {
      type: "wallpaper",
      name: req.file.originalname,
      url: uploadResult.url,
      uploadedBy: req.user.id,
      category,
      format: formatValidation.extension,
      tags: req.body.tags ? req.body.tags.split(",").map((tag) => tag.trim()) : [],
    };

    // Save to database
    const saveResult = await saveResourceToDatabase(resourceData);

    if (!saveResult.success) {
      return res.status(500).json({ message: saveResult.message });
    }

    // Return success response
    res.status(200).json({
      message: "Wallpaper uploaded successfully",
      url: uploadResult.url,
      wallpaper: saveResult.resource,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Upload error", error: error.message });
  }
};

/**
 * Admin uploads an audio file to Supabase
 */
exports.uploadAudio = async (req, res) => {
  try {
    console.log("Starting audio upload process...");

    if (!req.file) {
      console.log("No file uploaded");
      return res.status(400).json({ message: "No file uploaded" });
    }

    console.log("File received:", {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Validate audio format
    const validFormats = ["mp3", "wav", "ogg"];
    const formatValidation = validateFileFormat(req.file.originalname, validFormats);

    if (!formatValidation.valid) {
      console.log("Invalid file format:", formatValidation.message);
      return res.status(400).json({ message: formatValidation.message });
    }

    // Note: We're assuming the audio bucket already exists in Supabase

    // Upload file to Supabase
    const uploadResult = await uploadFileToSupabase(req.file, "audio", "audio");

    if (!uploadResult.success) {
      return res.status(500).json({ message: uploadResult.message });
    }

    console.log("Audio upload successful, URL:", uploadResult.url);

    // Prepare resource data for database
    const resourceData = {
      type: "audio",
      name: req.body.name || req.file.originalname,
      url: uploadResult.url,
      uploadedBy: req.user.id,
      format: formatValidation.extension,
      tags: req.body.tags ? req.body.tags.split(",").map((tag) => tag.trim()) : [],
    };

    // Save to database
    const saveResult = await saveResourceToDatabase(resourceData);

    if (!saveResult.success) {
      return res.status(500).json({ message: saveResult.message });
    }

    // Return success response
    res.status(200).json({
      message: "Audio uploaded successfully",
      url: uploadResult.url,
      audio: saveResult.resource,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      message: "Upload error",
      error: error.message,
      stack: error.stack
    });
  }
};

/**
 * Admin uploads a music file to Supabase
 */
exports.uploadMusic = async (req, res) => {
  try {
    console.log("Starting music upload process...");

    if (!req.file) {
      console.log("No file uploaded");
      return res.status(400).json({ message: "No file uploaded" });
    }

    console.log("File received:", {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Validate music format
    const validFormats = ["mp3", "wav", "ogg"];
    const formatValidation = validateFileFormat(req.file.originalname, validFormats);

    if (!formatValidation.valid) {
      console.log("Invalid file format:", formatValidation.message);
      return res.status(400).json({ message: formatValidation.message });
    }

    // Note: We're assuming the music bucket already exists in Supabase

    // Upload file to Supabase
    const uploadResult = await uploadFileToSupabase(req.file, "music", "music");

    if (!uploadResult.success) {
      return res.status(500).json({ message: uploadResult.message });
    }

    console.log("Music upload successful, URL:", uploadResult.url);

    // Prepare resource data for database
    const resourceData = {
      type: "music",
      name: req.body.name || req.file.originalname,
      url: uploadResult.url,
      uploadedBy: req.user.id,
      format: formatValidation.extension,
      tags: req.body.tags ? req.body.tags.split(",").map((tag) => tag.trim()) : [],
    };

    // Save to database
    const saveResult = await saveResourceToDatabase(resourceData);

    if (!saveResult.success) {
      return res.status(500).json({ message: saveResult.message });
    }

    // Return success response
    res.status(200).json({
      message: "Music uploaded successfully",
      url: uploadResult.url,
      music: saveResult.resource,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      message: "Upload error",
      error: error.message,
      stack: error.stack
    });
  }
};

/**
 * Delete a resource (Admin Only)
 */
exports.deleteResource = async (req, res) => {
  try {
    const deletedResource = await Resource.findByIdAndDelete(req.params.id);
    if (!deletedResource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    res.json({ message: "Resource deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Toggle resource active status (Admin Only)
 */
exports.toggleResourceStatus = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // Toggle the isActive status
    resource.isActive = !resource.isActive;
    await resource.save();

    res.json({
      message: `Resource ${resource.isActive ? 'activated' : 'deactivated'} successfully`,
      resource
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
