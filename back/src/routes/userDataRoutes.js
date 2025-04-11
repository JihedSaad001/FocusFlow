const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

// Models
const User = require("../models/User");
const Project = require("../models/Project");

// Middleware
const { authenticateJWT, isAdmin } = require("../middleware/authMiddleware");

// External Services
const { supabase } = require("../config/supabase");

// ==================== User Management Routes ====================

/**
 * @route   PUT /api/user/update-user
 * @desc    Update user profile
 * @access  Private
 */
router.put("/update-user", authenticateJWT, async (req, res) => {
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
});

/**
 * @route   POST /api/user/upload-profile-pic
 * @desc    Upload user profile picture
 * @access  Private
 */
router.post("/upload-profile-pic", authenticateJWT, upload.single("file"), async (req, res) => {
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
});

/**
 * @route   PUT /api/user/users/:userId/role
 * @desc    Update user role
 * @access  Private (Admin)
 */
router.put("/users/:userId/role", authenticateJWT, isAdmin, async (req, res) => {
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
});

/**
 * @route   GET /api/user/users
 * @desc    Get all users with project counts
 * @access  Private (Admin)
 */
router.get("/users", authenticateJWT, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}, "username email role tasksCompleted xp level lastActive");

    const projectCounts = await Promise.all(
      users.map(async (user) => {
        const count = await Project.countDocuments({
          $or: [{ owner: user._id }, { members: user._id }],
        });
        return {
          userId: user._id,
          count,
        };
      }),
    );

    const usersWithProjects = users.map((user) => {
      const projectData = projectCounts.find((p) => p.userId.toString() === user._id.toString());
      return {
        ...user.toObject(),
        projectCount: projectData ? projectData.count : 0,
      };
    });

    res.status(200).json({ users: usersWithProjects });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * @route   GET /api/user/stats/users
 * @desc    Get user statistics
 * @access  Private (Admin)
 */
router.get("/stats/users", authenticateJWT, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeUsers = await User.countDocuments({
      lastActive: { $gte: sevenDaysAgo },
    });

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
});

/**
 * @route   GET /api/user/data
 * @desc    Get user data (wallpaper, pomodoro settings, tasks, kanban)
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
      kanbanBoard: user.kanbanBoard,
    });
  } catch (error) {
    console.error("Error in GET /data:", error);
    res.status(500).json({ message: "Error fetching user data", error: error.message });
  }
});

// ==================== User Productivity Routes ====================

/**
 * @route   GET /api/user/kanban
 * @desc    Get user's Kanban board
 * @access  Private
 */
router.get("/kanban", authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ kanbanBoard: user.kanbanBoard });
  } catch (error) {
    console.error("Error in GET /kanban:", error);
    res.status(500).json({ message: "Error fetching Kanban board", error: error.message });
  }
});

/**
 * @route   PUT /api/user/kanban
 * @desc    Update user's Kanban board
 * @access  Private
 */
router.put("/kanban", authenticateJWT, async (req, res) => {
  try {
    const { columns } = req.body;
    console.log("PUT /kanban - User ID:", req.user.id, "Request body:", req.body);
    if (!columns || !Array.isArray(columns)) {
      return res.status(400).json({ message: "Invalid Kanban board data" });
    }

    const userBefore = await User.findById(req.user.id);
    console.log("User before update:", userBefore);

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { kanbanBoard: { columns } },
      { new: true, runValidators: true },
    );

    console.log("User after update:", user);
    if (!user) return res.status(404).json({ message: "User not found" });

    for (const column of columns) {
      for (const task of column.tasks) {
        if (task.projectId && task.sprintId && task.originalTaskId) {
          let status;
          switch (column.title) {
            case "To Do":
              status = "To Do";
              break;
            case "Doing":
              status = "In Progress";
              break;
            case "Done":
              status = "Done";
              break;
            default:
              continue;
          }

          await Project.updateOne(
            {
              _id: task.projectId,
              "sprints._id": task.sprintId,
              "sprints.tasks._id": task.originalTaskId,
            },
            {
              $set: { "sprints.$.tasks.$[taskElem].status": status },
            },
            {
              arrayFilters: [{ "taskElem._id": task.originalTaskId }],
            },
          );
        }
      }
    }

    res.status(200).json({ message: "Kanban board saved successfully", kanbanBoard: user.kanbanBoard });
  } catch (error) {
    console.error("Error in PUT /kanban:", error);
    res.status(500).json({ message: "Error saving Kanban board", error: error.message });
  }
});

/**
 * @route   POST /api/user/kanban/project-task
 * @desc    Add project task to user's Kanban board
 * @access  Private
 */
router.post("/kanban/project-task", authenticateJWT, async (req, res) => {
  try {
    const { projectId, sprintId, taskId } = req.body;

    if (!projectId || !sprintId || !taskId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    console.log("Adding project task to kanban:", { projectId, sprintId, taskId, userId: req.user.id });

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const sprint = project.sprints.id(sprintId);
    if (!sprint) {
      return res.status(404).json({ message: "Sprint not found" });
    }

    const task = sprint.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const backlogColumn = user.kanbanBoard.columns.find((col) => col.title === "Backlog");
    if (!backlogColumn) {
      return res.status(404).json({ message: "Backlog column not found" });
    }

    const taskExists = user.kanbanBoard.columns.some((col) =>
      col.tasks.some((t) => t.originalTaskId === taskId && t.projectId === projectId && t.sprintId === sprintId),
    );

    if (taskExists) {
      return res.status(400).json({ message: "Task already exists in kanban board" });
    }

    const newTaskId = new mongoose.Types.ObjectId().toString();
    console.log("Creating new task with ID:", newTaskId);

    backlogColumn.tasks.push({
      _id: newTaskId,
      title: task.title,
      description: task.description,
      priority: task.priority || "Medium",
      deadline: task.deadline,
      icon: "📝",
      projectId: projectId,
      sprintId: sprintId,
      originalTaskId: taskId,
    });

    await user.save();
    console.log("Task added to kanban board successfully");

    res.status(200).json({
      message: "Task added to kanban board",
      kanbanBoard: user.kanbanBoard,
    });
  } catch (error) {
    console.error("Error adding project task to kanban:", error);
    res.status(500).json({
      message: "Error adding task to kanban board",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/user/todo-tasks
 * @desc    Get user's todo tasks
 * @access  Private
 */
router.get("/todo-tasks", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      tasks: user.todoTasks || [],
    });
  } catch (error) {
    console.error("Error fetching todo tasks:", error);
    return res.status(500).json({ error: "Server error", message: error.message });
  }
});

/**
 * @route   PUT /api/user/todo-tasks
 * @desc    Update user's todo tasks
 * @access  Private
 */
router.put("/todo-tasks", authenticateJWT, async (req, res) => {
  try {
    const { tasks } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(tasks)) {
      return res.status(400).json({ message: "Tasks must be an array" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.todoTasks = tasks;
    await user.save();

    res.json({
      message: "Todo tasks updated successfully",
      tasks: user.todoTasks,
    });
  } catch (error) {
    console.error("Error updating todo tasks:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * @route   GET /api/user/stats
 * @desc    Get user productivity stats
 * @access  Private
 */
router.get("/stats", authenticateJWT, async (req, res) => {
  try {
    const { timeRange = "week" } = req.query;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const now = new Date();
    let startDate;

    switch (timeRange) {
      case "week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
    }

    const filteredFocusSessions = user.focusSessions
      ? user.focusSessions.filter((session) => new Date(session.timestamp) >= startDate)
      : [];

    const filteredFocusTime = user.focusTime
      ? user.focusTime.filter((entry) => new Date(entry.date) >= startDate)
      : [];

    const filteredDailyTasks = user.dailyTasks
      ? user.dailyTasks.filter((entry) => new Date(entry.date) >= startDate)
      : [];

    res.json({
      focusSessions: filteredFocusSessions || [],
      tasksCompleted: user.tasksCompleted || 0,
      xp: user.xp || 0,
      level: user.level || 1,
      focusTime: filteredFocusTime || [],
      dailyTasks: filteredDailyTasks || [],
      streakDays: user.streakDays || 0,
      lastActive: user.lastActive || new Date(),
      lastStreakUpdate: user.lastStreakUpdate,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * @route   POST /api/user/log-focus-session
 * @desc    Log a focus session
 * @access  Private
 */
router.post("/log-focus-session", authenticateJWT, async (req, res) => {
  try {
    const { duration, completed, ambientSound } = req.body;
    const userId = req.user.id;

    if (!duration) {
      return res.status(400).json({ message: "Duration is required" });
    }

    console.log("Logging focus session:", { duration, completed, ambientSound, userId });

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.focusSessions) user.focusSessions = [];
    if (!user.focusTime) user.focusTime = [];
    if (!user.dailyTasks) user.dailyTasks = [];

    user.focusSessions.push({
      duration,
      completed: completed || false,
      ambientSound,
      timestamp: new Date(),
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const focusTimeIndex = user.focusTime.findIndex(
      (entry) => new Date(entry.date).setHours(0, 0, 0, 0) === today.getTime(),
    );

    if (focusTimeIndex >= 0) {
      user.focusTime[focusTimeIndex].duration += duration;
    } else {
      user.focusTime.push({
        date: today,
        duration,
      });
    }

    if (!user.xp) user.xp = 0;

    const xpGained = Math.round(duration * 10);
    user.xp += xpGained;

    user.level = 1 + Math.floor(user.xp / 1000);

    user.lastActive = new Date();

    const lastUpdate = user.lastStreakUpdate ? new Date(user.lastStreakUpdate) : null;
    if (!lastUpdate) {
      user.streakDays = 1;
      user.lastStreakUpdate = new Date();
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastUpdateDay = new Date(lastUpdate);
      lastUpdateDay.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      if (lastUpdateDay.getTime() === yesterday.getTime()) {
        user.streakDays += 1;
        user.lastStreakUpdate = new Date();
      } else if (lastUpdateDay.getTime() < yesterday.getTime()) {
        user.streakDays = 1;
        user.lastStreakUpdate = new Date();
      }
    }

    await user.save();
    console.log("Focus session logged successfully");

    res.json({
      message: "Focus session logged successfully",
      xpGained,
      newLevel: user.level,
      streakDays: user.streakDays,
    });
  } catch (error) {
    console.error("Error logging focus session:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * @route   POST /api/user/log-completed-task
 * @desc    Log a completed task
 * @access  Private
 */
router.post("/log-completed-task", authenticateJWT, async (req, res) => {
  try {
    const { taskId } = req.body;
    const userId = req.user.id;

    if (!taskId) {
      return res.status(400).json({ message: "Task ID is required" });
    }

    console.log("Logging completed task:", { taskId, userId });

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.tasksCompleted) user.tasksCompleted = 0;
    if (!user.dailyTasks) user.dailyTasks = [];
    if (!user.xp) user.xp = 0;

    user.tasksCompleted += 1;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyTaskIndex = user.dailyTasks.findIndex(
      (entry) => new Date(entry.date).setHours(0, 0, 0, 0) === today.getTime(),
    );

    if (dailyTaskIndex >= 0) {
      user.dailyTasks[dailyTaskIndex].count += 1;
    } else {
      user.dailyTasks.push({
        date: today,
        count: 1,
      });
    }

    const xpGained = 50;
    user.xp += xpGained;

    user.level = 1 + Math.floor(user.xp / 1000);

    user.lastActive = new Date();

    const lastUpdate = user.lastStreakUpdate ? new Date(user.lastStreakUpdate) : null;
    if (!lastUpdate) {
      user.streakDays = 1;
      user.lastStreakUpdate = new Date();
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastUpdateDay = new Date(lastUpdate);
      lastUpdateDay.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      if (lastUpdateDay.getTime() === yesterday.getTime()) {
        user.streakDays += 1;
        user.lastStreakUpdate = new Date();
      } else if (lastUpdateDay.getTime() < yesterday.getTime()) {
        user.streakDays = 1;
        user.lastStreakUpdate = new Date();
      }
    }

    await user.save();
    console.log("Task completion logged successfully");

    res.json({
      message: "Task completion logged successfully",
      xpGained,
      newLevel: user.level,
      streakDays: user.streakDays,
    });
  } catch (error) {
    console.error("Error logging completed task:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * @route   GET /api/user/ai-insights
 * @desc    Get AI-generated productivity insights
 * @access  Private
 */
router.get("/ai-insights", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const focusSessions = user.focusSessions || [];
    const focusTime = user.focusTime || [];
    const dailyTasks = user.dailyTasks || [];

    const insights = generateProductivityInsights(focusSessions, focusTime, dailyTasks);

    res.json({
      insights,
    });
  } catch (error) {
    console.error("Error generating AI insights:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Helper function for AI insights
function generateProductivityInsights(focusSessions, focusTime, dailyTasks) {
  if (focusSessions.length < 3) {
    return {
      summary:
        "Not enough data to generate personalized insights yet. Complete more focus sessions to unlock AI-powered productivity analysis.",
      recommendations: [
        "Try using the Pomodoro technique with 25-minute focus sessions",
        "Use ambient sounds to improve concentration",
        "Break large tasks into smaller, manageable subtasks",
      ],
    };
  }

  const completedSessions = focusSessions.filter((session) => session.completed);
  const completionRate =
    focusSessions.length > 0 ? Math.round((completedSessions.length / focusSessions.length) * 100) : 0;

  const soundCounts = {};
  const soundCompletionCounts = {};

  focusSessions.forEach((session) => {
    if (session.ambientSound) {
      soundCounts[session.ambientSound] = (soundCounts[session.ambientSound] || 0) + 1;
      if (session.completed) {
        soundCompletionCounts[session.ambientSound] = (soundCompletionCounts[session.ambientSound] || 0) + 1;
      }
    }
  });

  let bestSound = "none";
  let bestSoundRate = 0;

  Object.keys(soundCounts).forEach((sound) => {
    const rate = soundCompletionCounts[sound] / soundCounts[sound];
    if (rate > bestSoundRate && soundCounts[sound] >= 3) {
      bestSoundRate = rate;
      bestSound = sound;
    }
  });

  const morningCount = focusSessions.filter((s) => {
    const hour = new Date(s.timestamp).getHours();
    return hour >= 5 && hour < 12;
  }).length;

  const afternoonCount = focusSessions.filter((s) => {
    const hour = new Date(s.timestamp).getHours();
    return hour >= 12 && hour < 17;
  }).length;

  const eveningCount = focusSessions.filter((s) => {
    const hour = new Date(s.timestamp).getHours();
    return hour >= 17 && hour < 22;
  }).length;

  let bestTimeOfDay = "morning";
  let bestTimeCount = morningCount;

  if (afternoonCount > bestTimeCount) {
    bestTimeOfDay = "afternoon";
    bestTimeCount = afternoonCount;
  }

  if (eveningCount > bestTimeCount) {
    bestTimeOfDay = "evening";
    bestTimeCount = eveningCount;
  }

  const durationCounts = {
    short: 0,
    medium: 0,
    long: 0,
  };

  const durationCompletionCounts = {
    short: 0,
    medium: 0,
    long: 0,
  };

  focusSessions.forEach((session) => {
    let category;
    if (session.duration < 15) category = "short";
    else if (session.duration <= 30) category = "medium";
    else category = "long";

    durationCounts[category]++;
    if (session.completed) {
      durationCompletionCounts[category]++;
    }
  });

  let bestDuration = "medium";
  let bestDurationRate = 0;

  Object.keys(durationCounts).forEach((duration) => {
    if (durationCounts[duration] > 0) {
      const rate = durationCompletionCounts[duration] / durationCounts[duration];
      if (rate > bestDurationRate) {
        bestDurationRate = rate;
        bestDuration = duration;
      }
    }
  });

  let recommendedDuration;
  if (bestDuration === "short") recommendedDuration = "10-15";
  else if (bestDuration === "medium") recommendedDuration = "25-30";
  else recommendedDuration = "40-45";

  return {
    summary: `Your focus session completion rate is ${completionRate}%. You tend to be most productive during the ${bestTimeOfDay}.`,
    patterns: {
      bestTimeOfDay,
      bestSound: bestSound !== "none" ? bestSound : "No clear pattern yet",
      bestDuration,
      completionRate: `${completionRate}%`,
    },
    recommendations: [
      `Schedule important tasks during the ${bestTimeOfDay} when you're most productive`,
      bestSound !== "none"
        ? `Use "${bestSound}" ambient sound to improve focus`
        : "Try different ambient sounds to find what works best for you",
      `Set your Pomodoro timer to ${recommendedDuration} minutes for optimal focus sessions`,
      "Take short breaks between focus sessions to maintain productivity",
    ],
    growthAreas: [
      completionRate < 70
        ? "Work on completing more of your focus sessions without interruption"
        : "Your focus session completion rate is good!",
      "Try to maintain a consistent daily schedule for better productivity",
      "Consider tracking which tasks you complete during your most productive times",
    ],
  };
}

module.exports = router;