const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { authenticateJWT } = require("../middleware/authMiddleware");

/**
 * @route   PUT /api/user/wallpaper
 * @desc    Save user's selected wallpaper
 * @access  Private
 */
router.put("/wallpaper", authenticateJWT, async (req, res) => {
  try {
    const { wallpaperUrl } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { wallpaper: wallpaperUrl },
      { new: true }
    );
    res.status(200).json({ message: "Wallpaper saved successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Error saving wallpaper", error: error.message });
  }
});

/**
 * @route   PUT /api/user/pomodoro
 * @desc    Save user's Pomodoro settings
 * @access  Private
 */
router.put("/pomodoro", authenticateJWT, async (req, res) => {
  try {
    const { mode, time, customMinutes } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { pomodoroSettings: { mode, time, customMinutes } },
      { new: true }
    );
    res.status(200).json({ message: "Pomodoro settings saved successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Error saving Pomodoro settings", error: error.message });
  }
});

/**
 * @route   PUT /api/user/tasks
 * @desc    Save user's To-Do list tasks
 * @access  Private
 */
router.put("/tasks", authenticateJWT, async (req, res) => {
  try {
    const { tasks } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id, 
      { tasks },
      { new: true }
    );
    res.status(200).json({ message: "Tasks saved successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Error saving tasks", error: error.message });
  }
});

/**
 * @route   GET /api/user/data
 * @desc    Get all user-specific data (wallpaper, Pomodoro settings, tasks)
 * @access  Private
 */
router.get("/data", authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      wallpaper: user.wallpaper,
      pomodoroSettings: user.pomodoroSettings,
      tasks: user.tasks,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user data", error: error.message });
  }
});

module.exports = router;