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

    // Get active users (active in the last 7 days)
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

    // You could add more project-related stats here

    res.status(200).json({
      totalProjects,
    });
  } catch (error) {
    console.error("Error fetching project statistics:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get all users with project counts
 */
exports.getUsers = async (req, res) => {
  try {
    // Get all users with basic info
    const users = await User.find({}, "username email role tasksCompleted xp level lastActive");

    // Get project counts for each user
    const projectCounts = await Promise.all(
      users.map(async (user) => {
        const count = await Project.countDocuments({
          $or: [{ owner: user._id }, { members: user._id }],
        });
        return {
          userId: user._id,
          count,
        };
      })
    );

    // Combine user data with project counts
    const usersWithProjects = users.map((user) => {
      const projectData = projectCounts.find((p) => p.userId.toString() === user._id.toString());
      return {
        ...user.toObject(),
        projectCount: projectData ? projectData.count : 0,
      };
    });

    res.status(200).json(usersWithProjects);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
