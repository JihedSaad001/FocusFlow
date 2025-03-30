const express = require("express")
const mongoose = require("mongoose")

module.exports = (User) => {
  const router = express.Router()
  const { authenticateJWT } = require("../middleware/authMiddleware")
  const Project = require("../models/Project")

  console.log("✅ User model in userDataRoutes:", Object.keys(User.schema.paths))

  router.put("/kanban", authenticateJWT, async (req, res) => {
    try {
      const { columns } = req.body
      console.log("PUT /kanban - User ID:", req.user.id, "Request body:", req.body)
      if (!columns || !Array.isArray(columns)) {
        return res.status(400).json({ message: "Invalid Kanban board data" })
      }

      const userBefore = await User.findById(req.user.id)
      console.log("User before update:", userBefore)

      const user = await User.findByIdAndUpdate(
        req.user.id,
        { kanbanBoard: { columns } },
        { new: true, runValidators: true },
      )

      console.log("User after update:", user)
      if (!user) return res.status(404).json({ message: "User not found" })

      // Update project sprint tasks if needed
      for (const column of columns) {
        for (const task of column.tasks) {
          if (task.projectId && task.sprintId && task.originalTaskId) {
            // Map column titles to project status
            let status
            switch (column.title) {
              case "To Do":
                status = "To Do"
                break
              case "Doing":
                status = "In Progress"
                break
              case "Done":
                status = "Done"
                break
              default:
                // For Backlog and To Test, don't update the project status
                continue
            }

            // Update the task status in the project
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
            )
          }
        }
      }

      res.status(200).json({ message: "Kanban board saved successfully", kanbanBoard: user.kanbanBoard })
    } catch (error) {
      console.error("Error in PUT /kanban:", error)
      res.status(500).json({ message: "Error saving Kanban board", error: error.message })
    }
  })

  router.get("/kanban", authenticateJWT, async (req, res) => {
    try {
      const user = await User.findById(req.user.id)
      if (!user) return res.status(404).json({ message: "User not found" })
      res.status(200).json({ kanbanBoard: user.kanbanBoard })
    } catch (error) {
      console.error("Error in GET /kanban:", error)
      res.status(500).json({ message: "Error fetching Kanban board", error: error.message })
    }
  })

  router.get("/data", authenticateJWT, async (req, res) => {
    try {
      const user = await User.findById(req.user.id)
      if (!user) return res.status(404).json({ message: "User not found" })
      res.status(200).json({
        wallpaper: user.wallpaper,
        pomodoroSettings: user.pomodoroSettings,
        tasks: user.tasks,
        kanbanBoard: user.kanbanBoard,
      })
    } catch (error) {
      console.error("Error in GET /data:", error)
      res.status(500).json({ message: "Error fetching user data", error: error.message })
    }
  })

  // New endpoint to add a project task to user's kanban board
  router.post("/kanban/project-task", authenticateJWT, async (req, res) => {
    try {
      const { projectId, sprintId, taskId } = req.body

      if (!projectId || !sprintId || !taskId) {
        return res.status(400).json({ message: "Missing required fields" })
      }

      console.log("Adding project task to kanban:", { projectId, sprintId, taskId, userId: req.user.id })

      // Find the project and task
      const project = await Project.findById(projectId)
      if (!project) {
        return res.status(404).json({ message: "Project not found" })
      }

      const sprint = project.sprints.id(sprintId)
      if (!sprint) {
        return res.status(404).json({ message: "Sprint not found" })
      }

      const task = sprint.tasks.id(taskId)
      if (!task) {
        return res.status(404).json({ message: "Task not found" })
      }

      // Add the task to the user's kanban board backlog
      const user = await User.findById(req.user.id)
      if (!user) {
        return res.status(404).json({ message: "User not found" })
      }

      // Find the backlog column
      const backlogColumn = user.kanbanBoard.columns.find((col) => col.title === "Backlog")
      if (!backlogColumn) {
        return res.status(404).json({ message: "Backlog column not found" })
      }

      // Check if task already exists in any column
      const taskExists = user.kanbanBoard.columns.some((col) =>
        col.tasks.some((t) => t.originalTaskId === taskId && t.projectId === projectId && t.sprintId === sprintId),
      )

      if (taskExists) {
        return res.status(400).json({ message: "Task already exists in kanban board" })
      }

      // Add task to backlog with a new unique _id
      const newTaskId = new mongoose.Types.ObjectId().toString()
      console.log("Creating new task with ID:", newTaskId)

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
      })

      await user.save()
      console.log("Task added to kanban board successfully")

      res.status(200).json({
        message: "Task added to kanban board",
        kanbanBoard: user.kanbanBoard,
      })
    } catch (error) {
      console.error("Error adding project task to kanban:", error)
      res.status(500).json({
        message: "Error adding task to kanban board",
        error: error.message,
      })
    }
  })

  return router
}

