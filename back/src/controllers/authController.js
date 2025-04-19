const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const supabase = require("../config/supabase");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../config/sendgrid");

/**
 * Register a new user and send verification email
 */
exports.signup = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already in use" });

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Token valid for 24 hours

    const newUser = new User({
      username,
      email,
      password,
      verificationToken,
      verificationTokenExpires: tokenExpiry,
      isVerified: false,
    });

    await newUser.save();

    // Send verification email
    const emailSent = await sendVerificationEmail(email, verificationToken, username);

    if (emailSent) {
      res.status(201).json({
        message: "User registered successfully. Please check your email to verify your account.",
        emailSent: true,
      });
    } else {
      res.status(201).json({
        message: "User registered, but there was an issue sending the verification email. Please contact support.",
        emailSent: false,
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Error registering user", error: error.message });
  }
};

/**
 * Verify user email with token
 */
exports.verifyEmail = async (req, res) => {
  const { token } = req.params;

  try {
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired verification token. Please request a new one.",
      });
    }

    // Update user as verified
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Email verified successfully. You can now log in." });
  } catch (error) {
    res.status(500).json({ message: "Error verifying email", error: error.message });
  }
};

/**
 * Resend verification email
 */
exports.resendVerification = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Token valid for 24 hours

    user.verificationToken = verificationToken;
    user.verificationTokenExpires = tokenExpiry;
    await user.save();

    // Send verification email
    const emailSent = await sendVerificationEmail(email, verificationToken, user.username);

    if (emailSent) {
      res.status(200).json({
        message: "Verification email resent. Please check your inbox.",
        emailSent: true,
      });
    } else {
      res.status(500).json({
        message: "Failed to send verification email. Please try again later.",
        emailSent: false,
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Error resending verification email", error: error.message });
  }
};

/**
 * Request password reset email
 */
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      // For security reasons, don't reveal if the email exists or not
      return res.status(200).json({
        message: "If your email is registered, you will receive a password reset link.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 1); // Token valid for 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = tokenExpiry;
    await user.save();

    // Send password reset email
    const emailSent = await sendPasswordResetEmail(email, resetToken, user.username);

    res.status(200).json({
      message: "If your email is registered, you will receive a password reset link.",
      emailSent,
    });
  } catch (error) {
    res.status(500).json({ message: "Error processing request", error: error.message });
  }
};

/**
 * Reset password with token
 */
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired password reset token. Please request a new one.",
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successfully. You can now log in with your new password." });
  } catch (error) {
    res.status(500).json({ message: "Error resetting password", error: error.message });
  }
};

/**
 * Authenticate user & get token
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(401).json({
        message: "Email not verified. Please check your inbox or request a new verification email.",
        needsVerification: true,
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "24h" });

    res.json({
      token,
      user: {
        username: user.username,
        email: user.email,
        profilePic: user.profilePic || "",
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Update user details (username, profilePic)
 */
exports.updateUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, profilePic } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (profilePic) {
      user.profilePic = profilePic;
    }

    if (username) {
      user.username = username;
    }

    await user.save();
    res.json({ success: true, message: "Profile updated successfully", user });
  } catch (error) {
    console.error("🔥 MongoDB Update Failed:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Upload profile picture
 */
exports.uploadProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      console.log("❌ No file uploaded.");
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileName = `${req.user.id}-${Date.now()}-${req.file.originalname}`;

    const { data, error } = await supabase.storage.from(process.env.SUPABASE_BUCKET).upload(fileName, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: true,
    });

    if (error) throw error;

    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_BUCKET}/${fileName}`;

    console.log("🖼️ Supabase Uploaded Image URL:", publicUrl);

    const userExists = await User.findById(req.user.id);
    console.log("🔍 Does User Exist in MongoDB?", userExists ? "✅ Yes" : "❌ No");

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { profilePic: publicUrl },
      { new: true, runValidators: true },
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
};

/**
 * Google login
 */
exports.googleLogin = async (req, res) => {
  const { access_token } = req.body;

  console.log("🔍 Received Google Token:", access_token);

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(access_token);

    if (error || !user) {
      console.log("❌ Supabase User Error:", error);
      return res.status(401).json({ message: "Google authentication failed" });
    }

    console.log("✅ Google User from Supabase:", user);

    let existingUser = await User.findOne({ email: user.email });

    if (!existingUser) {
      existingUser = new User({
        username: user.user_metadata.full_name || "Google User",
        email: user.email,
        profilePic: user.user_metadata.avatar_url || "",
        googleId: user.id,
        isVerified: true, // Google users are automatically verified
      });

      await existingUser.save();
      console.log("✅ New Google User Saved in MongoDB:", existingUser);
    }

    const token = jwt.sign({ id: existingUser._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
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
};

/**
 * Refresh token
 */
exports.refreshToken = async (req, res) => {
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
};

/**
 * Admin login
 */
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Admin not found" });

    if (user.role !== "admin") return res.status(403).json({ message: "Only admins can log in here" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET is missing! Check your .env file.");
      return res.status(500).json({ message: "Server error: missing JWT_SECRET" });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ message: "Admin login successful", token, admin: { username: user.username, role: user.role } });
  } catch (error) {
    console.error("🔥 Admin Login Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
