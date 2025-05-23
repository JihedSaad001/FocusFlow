const Resource = require("../models/Resource");
const { supabase } = require("../config/supabase");



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
 * Admin uploads a wallpaper to Supabase
 */
exports.uploadWallpaper = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Validate image format
    const validFormats = ["jpg", "jpeg", "png", "gif", "webp"];
    const fileExtension = req.file.originalname.split(".").pop()?.toLowerCase();

    if (!fileExtension || !validFormats.includes(fileExtension)) {
      return res.status(400).json({
        message: `Invalid file format. Must be one of: ${validFormats.join(", ")}`
      });
    }

    // Validate MIME type
    const validMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        message: `Invalid file type. File appears to be ${req.file.mimetype} but must be an image.`
      });
    }

    // Validate category
    const validCategories = ["nature", "abstract", "dark", "minimal"];
    const category = req.body.category || "abstract";
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: `Invalid category. Must be one of: ${validCategories.join(", ")}` });
    }

    // Create a unique filename with the original name
    const fileName = `wallpapers/${Date.now()}-${req.file.originalname}`;

    // Upload file to Supabase
    const { error } = await supabase.storage.from("wallpapers").upload(fileName, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: true,
    });

    if (error) {
      console.error("Supabase upload error:", error);
      return res.status(500).json({ message: `Failed to upload to Supabase: ${error.message}` });
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage.from("wallpapers").getPublicUrl(fileName);
    const publicUrl = publicUrlData?.publicUrl;

    if (!publicUrl) {
      return res.status(500).json({ message: "Failed to get public URL from Supabase" });
    }

    // Create and save the resource to database
    const newResource = new Resource({
      type: "wallpaper",
      name: req.file.originalname,
      url: publicUrl,
      uploadedBy: req.user.id,
      category,
      format: fileExtension,
      tags: req.body.tags ? req.body.tags.split(",").map((tag) => tag.trim()) : [],
    });

    await newResource.save();

    // Return success response
    res.status(200).json({
      message: "Wallpaper uploaded successfully",
      url: publicUrl,
      wallpaper: newResource,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Upload error", error: error.message });
  }
};

// Admin uploads an audio file to Supabase
 
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
    const fileExtension = req.file.originalname.split(".").pop()?.toLowerCase();

    if (!fileExtension || !validFormats.includes(fileExtension)) {
      console.log("Invalid file format:", fileExtension);
      return res.status(400).json({
        message: `Invalid file format. Must be one of: ${validFormats.join(", ")}`
      });
    }

    // Validate MIME type
    const validMimeTypes = ["audio/mpeg", "audio/wav", "audio/ogg"];
    if (!validMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        message: `Invalid file type. File appears to be ${req.file.mimetype} but must be an audio file.`
      });
    }

    // Create a unique filename with the original name
    const fileName = `audio/${Date.now()}-${req.file.originalname}`;

    // Upload file to Supabase
    const { error } = await supabase.storage.from("audio").upload(fileName, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: true,
    });

    if (error) {
      console.error("Supabase upload error:", error);
      return res.status(500).json({ message: `Failed to upload to Supabase: ${error.message}` });
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage.from("audio").getPublicUrl(fileName);
    const publicUrl = publicUrlData?.publicUrl;

    if (!publicUrl) {
      return res.status(500).json({ message: "Failed to get public URL from Supabase" });
    }

    console.log("Audio upload successful, URL:", publicUrl);

    // Create and save the resource to database
    const newResource = new Resource({
      type: "audio",
      name: req.body.name || req.file.originalname,
      url: publicUrl,
      uploadedBy: req.user.id,
      format: fileExtension,
      tags: req.body.tags ? req.body.tags.split(",").map((tag) => tag.trim()) : [],
    });

    await newResource.save();

    // Return success response
    res.status(200).json({
      message: "Audio uploaded successfully",
      url: publicUrl,
      audio: newResource,
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
    console.log("Starting music upload process");

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
    const fileExtension = req.file.originalname.split(".").pop()?.toLowerCase();

    if (!fileExtension || !validFormats.includes(fileExtension)) {
      console.log("Invalid file format:", fileExtension);
      return res.status(400).json({
        message: `Invalid file format. Must be one of: ${validFormats.join(", ")}`
      });
    }

    // Validate MIME type
    const validMimeTypes = ["audio/mpeg", "audio/wav", "audio/ogg"];
    if (!validMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        message: `Invalid file type. File appears to be ${req.file.mimetype} but must be an audio file.`
      });
    }

    // Create a unique filename with the original name
    const fileName = `music/${Date.now()}-${req.file.originalname}`;

    // Upload file to Supabase
    const { error } = await supabase.storage.from("music").upload(fileName, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: true,
    });

    if (error) {
      console.error("Supabase upload error:", error);
      return res.status(500).json({ message: `Failed to upload to Supabase: ${error.message}` });
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage.from("music").getPublicUrl(fileName);
    const publicUrl = publicUrlData?.publicUrl;

    if (!publicUrl) {
      return res.status(500).json({ message: "Failed to get public URL from Supabase" });
    }

    console.log("Music upload successful, URL:", publicUrl);

    // Create and save the resource to database
    const newResource = new Resource({
      type: "music",
      name: req.body.name || req.file.originalname,
      url: publicUrl,
      uploadedBy: req.user.id,
      format: fileExtension,
      tags: req.body.tags ? req.body.tags.split(",").map((tag) => tag.trim()) : [],
    });

    await newResource.save();

    // Return success response
    res.status(200).json({
      message: "Music uploaded successfully",
      url: publicUrl,
      music: newResource,
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
