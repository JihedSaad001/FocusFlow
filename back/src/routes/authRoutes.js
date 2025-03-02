const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const User = require("../models/User");
const { authenticateJWT, isAdmin } = require("../middleware/authMiddleware");
const supabase = require("../config/supabase"); // ✅ Ensure Supabase is imported

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  try {
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: "Email already in use" });
      const newUser = new User({ username, email, password });
      await newUser.save();
      res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
      res.status(500).json({ message: "Error registering user", error: error.message });
  }
});
/**
 * @route   PUT /api/auth/update-user
 * @desc    Updates user profile (username, password, profilePic)
 * @access  Private
 */
// Back-end route for updating user profile
router.put("/update-user", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, profilePic } = req.body; // ✅ Get profilePic from request

    // ✅ Fetch user from MongoDB
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // ✅ Update profilePic if provided
    if (profilePic) {
      user.profilePic = profilePic;
    }

    // ✅ Update username if provided
    if (username) {
      user.username = username;
    }

    await user.save(); // ✅ Save the updated user data
    res.json({ success: true, message: "Profile updated successfully", user });
  } catch (error) {
    console.error("🔥 MongoDB Update Failed:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});



/**
* @route   POST /api/auth/upload-profile-pic
* @desc    Uploads profile picture and updates user profile
* @access  Private (User must be logged in)
*/
router.post("/upload-profile-pic", authenticateJWT, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      console.log("❌ No file uploaded.");
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileName = `${req.user.id}-${Date.now()}-${req.file.originalname}`;

    // ✅ Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (error) throw error;

    // ✅ Construct the correct public URL
    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_BUCKET}/${fileName}`;

    console.log("🖼️ Supabase Uploaded Image URL:", publicUrl);

    // ✅ Debug: Check if user exists before updating
    const userExists = await User.findById(req.user.id);
    console.log("🔍 Does User Exist in MongoDB?", userExists ? "✅ Yes" : "❌ No");

    // ✅ Save URL in MongoDB
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { profilePic: publicUrl },
      { new: true, runValidators: true }
    );

    console.log("📂 MongoDB Update Result:", updatedUser);

    if (!updatedUser) {
      return res.status(500).json({ message: "Failed to update user in MongoDB." });
    }

    res.status(200).json({ message: "Profile picture updated!", profilePic: publicUrl });
  } catch (error) {
    console.error("❌ Upload Error:", error);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
});

router.post("/google-login", async (req, res) => {
  const { access_token } = req.body;

  console.log("🔍 Received Google Token:", access_token); // 🔥 Debugging

  try {
    const { data: { user }, error } = await supabase.auth.getUser(access_token);

    if (error || !user) {
      console.log("❌ Supabase User Error:", error);
      return res.status(401).json({ message: "Google authentication failed" });
    }

    console.log("✅ Google User from Supabase:", user); // 🔥 Debugging

    let existingUser = await User.findOne({ email: user.email });

    if (!existingUser) {
      existingUser = new User({
        username: user.user_metadata.full_name || "Google User",
        email: user.email,
        profilePic: user.user_metadata.avatar_url || "",
        googleId: user.id,
      });

      await existingUser.save();
      console.log("✅ New Google User Saved in MongoDB:", existingUser);
    }

    const token = jwt.sign({ id: existingUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      token,
      user: {
        username: existingUser.username,
        email: existingUser.email,
        profilePic: existingUser.profilePic,
      },
    });

  } catch (error) {
    console.error("❌ Google Login Backend Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // ✅ Include `profilePic` in the response
    res.json({
      token,
      user: {
        username: user.username,
        email: user.email,
        profilePic: user.profilePic || "", // ✅ Ensure profile picture is included
      },
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/refresh-token", async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    const newToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "24h" });
    res.json({ token: newToken });
  } catch (error) {
    console.error("Refresh Token Error:", error);
    res.status(401).json({ message: "Invalid refresh token" });
  }
});
/**
 * @route   POST /api/auth/admin-login
 * @desc    Authenticate admin & get token
 * @access  Admin Only
 */
router.post("/admin-login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Admin not found" });

    if (user.role !== "admin") return res.status(403).json({ message: "Only admins can log in here" });

    // ✅ Correctly compare admin password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET is missing! Check your .env file.");
      return res.status(500).json({ message: "Server error: missing JWT_SECRET" });
    }

    // ✅ Generate JWT token for admin
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ message: "Admin login successful", token, admin: { username: user.username, role: user.role } });
  } catch (error) {
    console.error("🔥 Admin Login Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;