/**
 * User data controller
 */

/**
 * Update user's kanban board
 */
exports.updateKanbanBoard = async (req, res, User) => {
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

    res.status(200).json({ message: "Kanban board saved successfully", kanbanBoard: user.kanbanBoard });
  } catch (error) {
    console.error("Error in PUT /kanban:", error);
    res.status(500).json({ message: "Error saving Kanban board", error: error.message });
  }
};

/**
 * Get user's kanban board
 */
exports.getKanbanBoard = async (req, res, User) => {
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
exports.getUserData = async (req, res, User) => {
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
};

/**
 * Add a project task to user's kanban board
 */
exports.addProjectTaskToKanban = async (req, res, User, Project) => {
  try {
    const { projectId, sprintId, taskId } = req.body;

    if (!projectId || !sprintId || !taskId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    console.log("Adding project task to kanban:", { projectId, sprintId, taskId, userId: req.user.id });

    // Find the project and task
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

    // Find the user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize kanbanBoard if it doesn't exist
    if (!user.kanbanBoard) {
      user.kanbanBoard = {
        columns: [
          { id: "todo", title: "To Do", taskIds: [] },
          { id: "in-progress", title: "In Progress", taskIds: [] },
          { id: "done", title: "Done", taskIds: [] },
        ],
      };
    }

    // Create a unique ID for the task in the kanban board
    const kanbanTaskId = `project-${projectId}-sprint-${sprintId}-task-${taskId}`;

    // Check if task already exists in any column
    let taskExists = false;
    user.kanbanBoard.columns.forEach((column) => {
      if (column.taskIds.includes(kanbanTaskId)) {
        taskExists = true;
      }
    });

    if (taskExists) {
      return res.status(400).json({ message: "Task already exists in Kanban board" });
    }

    // Add task to the "todo" column
    const todoColumn = user.kanbanBoard.columns.find((column) => column.id === "todo");
    if (!todoColumn) {
      return res.status(500).json({ message: "Kanban board structure is invalid" });
    }

    todoColumn.taskIds.push(kanbanTaskId);

    // Add task to the tasks array if it doesn't exist
    if (!user.tasks) {
      user.tasks = [];
    }

    user.tasks.push({
      id: kanbanTaskId,
      content: task.title,
      description: task.description || "",
      projectId,
      sprintId,
      taskId,
      isProjectTask: true,
    });

    await user.save();

    res.status(200).json({
      message: "Project task added to Kanban board",
      kanbanBoard: user.kanbanBoard,
      tasks: user.tasks,
    });
  } catch (error) {
    console.error("Error adding project task to kanban:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get user's todo tasks
 */
exports.getTodoTasks = async (req, res, User) => {
  try {
    const userId = req.user.id;

    // Find the user
    const user = await User.findById(userId);
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
exports.updateTodoTasks = async (req, res, User) => {
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
exports.getUserStats = async (req, res, User) => {
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
exports.logFocusSession = async (req, res, User) => {
  try {
    const { duration, completed, ambientSound } = req.body;
    const userId = req.user.id;

    if (!duration) {
      return res.status(400).json({ message: "Duration is required" });
    }

    console.log("Logging focus session:", { duration, completed, ambientSound, userId });

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
    user.focusSessions.push({
      duration,
      completed: completed || false,
      ambientSound,
      timestamp: new Date(),
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
};

/**
 * Log a completed task
 */
exports.logCompletedTask = async (req, res, User) => {
  try {
    const { taskId } = req.body;
    const userId = req.user.id;

    if (!taskId) {
      return res.status(400).json({ message: "Task ID is required" });
    }

    console.log("Logging completed task:", { taskId, userId });

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize fields if they don't exist
    if (!user.tasksCompleted) user.tasksCompleted = 0;
    if (!user.dailyTasks) user.dailyTasks = [];
    if (!user.xp) user.xp = 0;

    // Increment tasks completed
    user.tasksCompleted += 1;

    // Update daily tasks for today
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

    // Update XP (simple formula: 50 XP per completed task)
    const xpGained = 50;
    user.xp += xpGained;

    // Update level (simple formula: level = 1 + floor(xp / 1000))
    user.level = 1 + Math.floor(user.xp / 1000);

    // Update last active
    user.lastActive = new Date();

    // Update streak (same logic as focus session)
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
};

// AI insights functionality removed
