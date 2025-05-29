
const User = require("../models/User");


/**
 * Update user's kanban board
 */
exports.updateKanbanBoard = async (req, res) => {
  try {
    const { columns } = req.body;
   
    if (!columns || !Array.isArray(columns)) {
      return res.status(400).json({ message: "Invalid Kanban board data" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { kanbanBoard: { columns } },
      { new: true, runValidators: true },
    );

    console.log("User after update:", user);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "Kanban board saved successfully", kanbanBoard: user.kanbanBoard });
  } catch (error) {
    console.error("Error in PUT /kanban:", error);
    res.status(500).json({ message: "Error saving Kanban board", error: error.message });
  }
};

/**
 * Get user's kanban board
 */
exports.getKanbanBoard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ kanbanBoard: user.kanbanBoard });
  } catch (error) {
    console.error("Error in GET /kanban:", error);
    res.status(500).json({ message: "Error fetching Kanban board", error: error.message });
  }
};

/**
 * Get user data
 */
exports.getUserData = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({
      wallpaper: user.wallpaper,
      tasks: user.tasks,
      kanbanBoard: user.kanbanBoard,
    });
  } catch (error) {
    console.error("Error in GET /data:", error);
    res.status(500).json({ message: "Error fetching user data", error: error.message });
  }
};

/**
 * Get user's todo tasks
 */
exports.getTodoTasks = async (req, res) => {
  try {

    // Find the user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return tasks or empty array if not set
    return res.json({
      tasks: user.todoTasks || [],
    });
  } catch (error) {
    console.error("Error fetching todo tasks:", error);
    return res.status(500).json({ error: "Server error", message: error.message });
  }
};

/**
 * Update user's todo tasks
 */
exports.updateTodoTasks = async (req, res) => {
  try {
    const { tasks } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(tasks)) {
      return res.status(400).json({ message: "Tasks must be an array" });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user's todo tasks
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
};

/**
 * Get user productivity stats
 */
exports.getUserStats = async (req, res) => {
  try {
    const { timeRange = "week" } = req.query;
    const userId = req.user.id;
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Calculate date range
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
    // Filter data based on date range
    const filteredFocusSessions = user.focusSessions
      ? user.focusSessions.filter((session) => new Date(session.timestamp) >= startDate)
      : [];
    const filteredFocusTime = user.focusTime
      ? user.focusTime.filter((entry) => new Date(entry.date) >= startDate)
      : [];
    const filteredDailyTasks = user.dailyTasks
      ? user.dailyTasks.filter((entry) => new Date(entry.date) >= startDate)
      : [];
    // Return the filtered stats
    res.json({
      focusSessions: filteredFocusSessions || [],
      tasksCompleted: user.tasksCompleted || 0,
      xp: user.xp || 0,
      level: user.level || 1,
      focusTime: filteredFocusTime || [],
      dailyTasks: filteredDailyTasks || [],
      todoTasks: user.todoTasks || [],
      streakDays: user.streakDays || 0,
      lastActive: user.lastActive || new Date(),
      lastStreakUpdate: user.lastStreakUpdate,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Log a focus session
 */
exports.logFocusSession = async (req, res) => {
  try {
    const { duration, completed, ambientSound } = req.body;
    const userId = req.user.id;

    if (!duration) {
      return res.status(400).json({ message: "Duration is required" });
    }

    // Ensure ambientSound is properly handled
    // If ambientSound is undefined, null, or empty string, set it to null
    const soundToLog = ambientSound && ambientSound.trim() !== "" ? ambientSound : null;

  
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize arrays if they don't exist
    if (!user.focusSessions) user.focusSessions = [];
    if (!user.focusTime) user.focusTime = [];
    if (!user.dailyTasks) user.dailyTasks = [];

    // Add focus session
    const newSession = {
      duration,
      completed: completed || false,
      ambientSound: soundToLog,
      timestamp: new Date(),
    };

    user.focusSessions.push(newSession);

    console.log("Added new focus session to user:", {
      userId: user._id,
      username: user.username,
      sessionData: newSession
    });

    // Update focus time for today
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

    // Initialize XP if it doesn't exist
    if (!user.xp) user.xp = 0;

    // Update XP (simple formula: 10 XP per minute of focus)
    const xpGained = Math.round(duration * 10);
    user.xp += xpGained;

    // Update level (simple formula: level = 1 + floor(xp / 1000))
    user.level = 1 + Math.floor(user.xp / 1000);

    // Update last active
    user.lastActive = new Date();

    // Update streak
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
        // Last update was yesterday, increment streak
        user.streakDays += 1;
        user.lastStreakUpdate = new Date();
      } else if (lastUpdateDay.getTime() < yesterday.getTime()) {
        // Streak broken, reset to 1
        user.streakDays = 1;
        user.lastStreakUpdate = new Date();
      }
      // If last update was today, don't change streak
    }

    await user.save();

    // Get the most recent focus session to verify it was saved correctly
    const savedSession = user.focusSessions[user.focusSessions.length - 1];

    console.log("Focus session logged successfully:", {
      savedSession,
      ambientSoundSaved: savedSession.ambientSound,
      totalFocusSessions: user.focusSessions.length
    });

    res.json({
      message: "Focus session logged successfully",
      xpGained,
      newLevel: user.level,
      streakDays: user.streakDays,
      sessionLogged: {
        duration,
        completed,
        ambientSound: soundToLog
      }
    });
  } catch (error) {
    console.error("Error logging focus session:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Log a completed task
 */
exports.logCompletedTask = async (req, res) => {
  try {
    const { taskId } = req.body;
    const userId = req.user.id;

    if (!taskId) {
      return res.status(400).json({ message: "Task ID is required" });
    }

    console.log("Logging completed task:", { taskId, userId });

    // First, check if the user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get today's date for dailyTasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Use updateOne with $inc to safely increment counters
    const updateResult = await User.updateOne(
      { _id: userId },
      {
        $inc: {
          tasksCompleted: 1,
          xp: 50 // 50 XP per completed task
        },
        $set: {
          lastActive: new Date()
        }
      }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(404).json({ message: "Failed to update user" });
    }

    // Now handle the daily tasks in a separate query
    // First check if there's an entry for today
    const userWithDailyTasks = await User.findOne(
      {
        _id: userId,
        "dailyTasks.date": {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    );

    if (userWithDailyTasks) {
      // There's an entry for today, increment it
      await User.updateOne(
        {
          _id: userId,
          "dailyTasks.date": {
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
          }
        },
        {
          $inc: { "dailyTasks.$.count": 1 }
        }
      );
    } else {
      // No entry for today, add one
      await User.updateOne(
        { _id: userId },
        {
          $push: {
            dailyTasks: {
              date: today,
              count: 1
            }
          }
        }
      );
    }

    // Update level based on XP
    const updatedUser = await User.findById(userId);
    updatedUser.level = 1 + Math.floor(updatedUser.xp / 1000);

    // Update streak
    const lastUpdate = updatedUser.lastStreakUpdate ? new Date(updatedUser.lastStreakUpdate) : null;
    if (!lastUpdate) {
      updatedUser.streakDays = 1;
      updatedUser.lastStreakUpdate = new Date();
    } else {
      const lastUpdateDay = new Date(lastUpdate);
      lastUpdateDay.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      if (lastUpdateDay.getTime() === yesterday.getTime()) {
        // Last update was yesterday, increment streak
        updatedUser.streakDays += 1;
        updatedUser.lastStreakUpdate = new Date();
      } else if (lastUpdateDay.getTime() < yesterday.getTime()) {
        // Streak broken, reset to 1
        updatedUser.streakDays = 1;
        updatedUser.lastStreakUpdate = new Date();
      }
      // If last update was today, don't change streak
    }

    await updatedUser.save();
    console.log("Task completion logged successfully");

    res.json({
      message: "Task completion logged successfully",
      xpGained: 50,
      newLevel: updatedUser.level,
      streakDays: updatedUser.streakDays,
    });
  } catch (error) {
    console.error("Error logging completed task:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Update user's wallpaper preference
 */
exports.updateWallpaper = async (req, res) => {
  try {
    const { wallpaperUrl } = req.body;
    const userId = req.user.id;

    if (!wallpaperUrl) {
      return res.status(400).json({ message: "Wallpaper URL is required" });
    }

    console.log("Updating wallpaper for user:", userId, "URL:", wallpaperUrl);

    // Find and update the user
    const user = await User.findByIdAndUpdate(
      userId,
      { wallpaper: wallpaperUrl },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Wallpaper updated successfully",
      wallpaper: user.wallpaper
    });
  } catch (error) {
    console.error("Error updating wallpaper:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get user's wallpaper preference
 */
exports.getWallpaper = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      wallpaper: user.wallpaper || ""
    });
  } catch (error) {
    console.error("Error fetching wallpaper:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

