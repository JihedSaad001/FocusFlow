const User = require("../models/User");
const Project = require("../models/Project");

/**
 * Update user role
 */
exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = role;
    await user.save();

    res.status(200).json({ message: "User role updated successfully", user });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get user statistics
 */
exports.getUserStats = async (req, res) => {
  try {
    // Get total users
    const totalUsers = await User.countDocuments();

    // Get active users (the last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeUsers = await User.countDocuments({
      lastActive: { $gte: sevenDaysAgo },
    });

    // Get total focus time across all users (in minutes)
    const users = await User.find({}, "focusTime");
    let totalFocusTime = 0;

    users.forEach((user) => {
      if (user.focusTime && Array.isArray(user.focusTime)) {
        user.focusTime.forEach((session) => {
          totalFocusTime += session.duration || 0;
        });
      }
    });

    res.status(200).json({
      totalUsers,
      activeUsers,
      totalFocusTime,
    });
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get project statistics
 */
exports.getProjectStats = async (req, res) => {
  try {
    // Get total projects
    const totalProjects = await Project.countDocuments();
    res.status(200).json({
      totalProjects,
    });
  } catch (error) {
    console.error("Error fetching project statistics:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all users with project counts (Simple Version)
exports.getUsers = async (req, res) => {
  try {
    // Step 1: Get all users
    const users = await User.find({}, "username email role tasksCompleted xp level lastActive");

    // Step 2: Add project count to each user
    const usersWithProjects = [];

    for (let user of users) {
      // Count projects for this user
      const projectCount = await Project.countDocuments({
        $or: [
          { owner: user._id },      // User owns the project
          { members: user._id }     // User is a member
        ]
      });

      // Add project count to user data
      usersWithProjects.push({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        tasksCompleted: user.tasksCompleted,
        xp: user.xp,
        level: user.level,
        lastActive: user.lastActive,
        projectCount: projectCount
      });
    }

    res.status(200).json(usersWithProjects);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
