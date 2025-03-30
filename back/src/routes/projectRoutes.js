const express = require("express")
const mongoose = require("mongoose")
const Project = require("../models/Project")
const User = require("../models/User")
const { authenticateJWT } = require("../middleware/authMiddleware")

const router = express.Router()

module.exports = (io) => {
  router.use((req, res, next) => {
    req.io = io
    next()
  })

  // Route to create a new project
  router.post("/", authenticateJWT, async (req, res) => {
    try {
      const { name, description } = req.body
      const newProject = new Project({
        name,
        description,
        owner: req.user.id,
        members: [req.user.id],
      })

      await newProject.save()
      res.status(201).json(newProject)
    } catch (error) {
      console.error("Error creating project:", error)
      res.status(500).json({ message: "Error creating project", error: error.message })
    }
  })

  // Route to get all projects for a user
  router.get("/", authenticateJWT, async (req, res) => {
    try {
      const projects = await Project.find({ members: req.user.id }).populate("members", "username email")
      res.status(200).json(projects)
    } catch (error) {
      console.error("Error fetching projects:", error)
      res.status(500).json({ message: "Error fetching projects", error: error.message })
    }
  })

  // Route to get a specific project by ID
  router.get("/:projectId", authenticateJWT, async (req, res) => {
    try {
      const project = await Project.findById(req.params.projectId)
        .populate("members", "username email")
        .populate("owner", "username")
      if (!project) return res.status(404).json({ message: "Project not found" })
      console.log(
        "User ID:",
        req.user.id,
        "Project Members:",
        project.members.map((m) => m._id.toString()),
      )
      if (!project.members.map((m) => m._id.toString()).includes(req.user.id))
        return res.status(403).json({ message: "Unauthorized" })
      res.status(200).json(project)
    } catch (error) {
      console.error("Error fetching project:", error)
      res.status(500).json({ message: "Error fetching project", error: error.message })
    }
  })

  // Route to update a project
  router.put("/:projectId", authenticateJWT, async (req, res) => {
    try {
      const projectId = req.params.projectId
      const { name, description } = req.body
      const userId = req.user.id

      const project = await Project.findById(projectId)

      if (!project) {
        return res.status(404).json({ message: "Project not found" })
      }

      if (project.owner.toString() !== userId) {
        return res.status(403).json({ message: "Unauthorized" })
      }

      project.name = name
      project.description = description

      await project.save()
      res.status(200).json(project)
    } catch (error) {
      console.error("Error updating project:", error)
      res.status(500).json({ message: "Error updating project", error: error.message })
    }
  })

  // Route to delete a project
  router.delete("/:projectId", authenticateJWT, async (req, res) => {
    try {
      const project = await Project.findById(req.params.projectId)
      if (!project) {
        return res.status(404).json({ message: "Project not found" })
      }

      if (!project.members.map((m) => m._id.toString()).includes(req.user.id.toString())) {
        return res.status(403).json({ message: "Unauthorized to delete this project" })
      }

      if (project.owner._id.toString() !== req.user.id.toString()) {
        return res.status(403).json({ message: "Only the project owner can delete this project" })
      }

      await Project.deleteOne({ _id: req.params.projectId })
      res.status(200).json({ message: "Project deleted successfully" })
    } catch (error) {
      res.status(500).json({ message: "Error deleting project", error: error.message })
    }
  })

  // Route to add a member to a project
  router.post("/:projectId/members", authenticateJWT, async (req, res) => {
    try {
      const { email } = req.body
      const project = await Project.findById(req.params.projectId)
      if (!project) return res.status(404).json({ message: "Project not found" })

      if (project.owner.toString() !== req.user.id)
        return res.status(403).json({ message: "Only the project owner can invite members" })

      const user = await User.findOne({ email })
      if (!user) return res.status(404).json({ message: "User not found" })

      if (!project.members.includes(user._id)) {
        project.members.push(user._id)
        await project.save()
      }

      res.status(200).json({ message: "User invited successfully", project })
    } catch (error) {
      res.status(500).json({ message: "Error inviting user", error: error.message })
    }
  })

  // Route to remove a member from a project
  router.delete("/:projectId/members/:memberId", authenticateJWT, async (req, res) => {
    try {
      const project = await Project.findById(req.params.projectId)
        .populate("owner", "username")
        .populate("members", "username email")
      if (!project) return res.status(404).json({ message: "Project not found" })

      if (project.owner._id.toString() !== req.user.id) {
        return res.status(403).json({ message: "Only the project owner can remove members" })
      }

      if (req.params.memberId === req.user.id) {
        return res.status(400).json({ message: "You cannot remove yourself from the project" })
      }

      const memberIndex = project.members.findIndex((member) => member._id.toString() === req.params.memberId)
      if (memberIndex === -1) {
        return res.status(404).json({ message: "Member not found in project" })
      }

      project.members.splice(memberIndex, 1)
      await project.save()

      const updatedProject = await Project.findById(req.params.projectId)
        .populate("owner", "username")
        .populate("members", "username email")

      res.status(200).json({ message: "Member removed successfully", project: updatedProject })
    } catch (error) {
      res.status(500).json({ message: "Error removing member", error: error.message })
    }
  })

  // Route to start a poker session
  router.post("/:projectId/poker/start", authenticateJWT, async (req, res) => {
    try {
      const project = await Project.findById(req.params.projectId)
      if (!project) return res.status(404).json({ message: "Project not found" })

      if (!project.activePokerSession) {
        project.activePokerSession = { issues: [] }
      }

      await project.save()
      res.status(201).json({ message: "Poker session started" })
    } catch (error) {
      res.status(500).json({ message: "Error starting poker session", error: error.message })
    }
  })

  // Route to end a poker session
  router.get("/:projectId/poker", authenticateJWT, async (req, res) => {
    console.log("Incoming request to fetch poker session for project", req.params.projectId)
    try {
      const project = await Project.findById(req.params.projectId)
        .populate("members", "username")
        .populate("activePokerSession.issues.votes.user", "username")
      if (!project) {
        console.log("Project not found")
        return res.status(404).json({ message: "Project not found" })
      }
      if (!project.members.map((m) => m._id.toString()).includes(req.user.id)) {
        return res.status(403).json({ message: "Unauthorized" })
      }
      res.status(200).json(project.activePokerSession)
    } catch (error) {
      console.error("Error fetching poker session:", error)
      res.status(500).json({ message: "Error fetching poker session", error: error.message })
    }
  })

  // Route to add an issue to the poker session
  router.post("/:projectId/poker/issue", authenticateJWT, async (req, res) => {
    const { projectId } = req.params
    const { title, description } = req.body
    try {
      const project = await Project.findById(projectId)
      if (!project) {
        return res.status(404).json({ message: "Project not found" })
      }
      if (!project.members.map((m) => m._id.toString()).includes(req.user.id)) {
        return res.status(403).json({ message: "Unauthorized" })
      }
      if (!project.activePokerSession) {
        project.activePokerSession = { issues: [] }
      }
      const newIssue = { _id: new mongoose.Types.ObjectId(), title, description, status: "Not Started", votes: [] }
      project.activePokerSession.issues.push(newIssue)
      await project.save()

      // Get the saved issue with proper MongoDB ObjectId
      const savedIssue = project.activePokerSession.issues.find(
        (i) => i.title === title && i.description === description,
      )

      console.log(`Emitting issueAdded event to room ${projectId} for issue ${savedIssue._id}`)
      req.io.to(projectId).emit("issueAdded", { issue: savedIssue })

      res.status(201).json(savedIssue)
    } catch (error) {
      console.error("Error adding issue:", error)
      res.status(500).json({ message: "Error adding issue", error: error.message })
    }
  })

  // Route to record a vote for an issue
  router.post("/:projectId/poker/issue/:issueId/vote", authenticateJWT, async (req, res) => {
    const { projectId, issueId } = req.params
    const { vote } = req.body
    const userId = req.user.id

    try {
      const project = await Project.findById(projectId).populate("members", "username")
      if (!project || !project.activePokerSession) {
        return res.status(404).json({ message: "Project or poker session not found" })
      }

      if (!project.members.map((m) => m._id.toString()).includes(userId)) {
        return res.status(403).json({ message: "Unauthorized" })
      }

      const issue = project.activePokerSession.issues.find((i) => i._id.toString() === issueId)
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" })
      }

      const existingVoteIndex = issue.votes.findIndex((v) => v.user.toString() === userId)
      if (existingVoteIndex !== -1) {
        issue.votes[existingVoteIndex].vote = vote
        console.log(`Updated vote for user ${userId} to ${vote} on issue ${issueId}`)
      } else {
        issue.votes.push({ user: userId, vote })
        console.log(`Added vote ${vote} for user ${userId} on issue ${issueId}`)
      }

      await project.save()
      console.log(`Saved votes for issue ${issueId}:`, issue.votes)

      const votingUser = project.members.find((m) => m._id.toString() === userId)

      const username = votingUser ? votingUser.username : "Unknown"
      console.log(`Emitting voteUpdate event to room ${projectId}:`, {
        issueId,
        vote,
        userId,
        username,
        totalVotes: issue.votes.length,
      })

      req.io.to(projectId).emit("voteUpdate", {
        issueId,
        vote,
        userId,
        username,
        totalVotes: issue.votes.length,
      })

      res.status(200).json({ message: "Vote recorded successfully" })
    } catch (error) {
      console.error("Error recording vote:", error)
      res.status(500).json({ message: "Error recording vote", error: error.message })
    }
  })

  // Fetch chat messages
  router.get("/:projectId/chat", authenticateJWT, async (req, res) => {
    const project = await Project.findById(req.params.projectId).populate("chatMessages.user", "username profilePic") // Add profilePic to populate
    if (!project) return res.status(404).json({ message: "Project not found" })
    if (!project.members.map((m) => m._id.toString()).includes(req.user.id))
      return res.status(403).json({ message: "Unauthorized" })
    res.status(200).json(project.chatMessages || [])
  })

  // Socket.IO event for sending messages
  io.on("connection", (socket) => {
    socket.on("joinRoom", (projectId) => {
      socket.join(projectId)
      console.log(`Socket ${socket.id} joined room ${projectId}`)

      // Notify the client that they've successfully joined the room
      socket.emit("roomJoined", { projectId })
    })

    socket.on("sendMessage", async ({ projectId, userId, message }) => {
      const project = await Project.findById(projectId)
      if (!project) return
      const user = await User.findById(userId).select("username profilePic") // Fetch profilePic
      const newMessage = { user: userId, message, timestamp: new Date() }
      project.chatMessages.push(newMessage)
      await project.save()
      io.to(projectId).emit("receiveMessage", {
        user: { _id: userId, username: user.username, profilePic: user.profilePic }, // Include profilePic
        message,
        timestamp: newMessage.timestamp,
      })
    })
  })

  router.post("/:projectId/poker/issue/:issueId/revote", authenticateJWT, async (req, res) => {
    try {
      const project = await Project.findById(req.params.projectId)
      if (!project) return res.status(404).json({ message: "Project not found" })

      if (project.owner.toString() !== req.user.id) {
        return res.status(403).json({ message: "Only the project owner can reset votes" })
      }

      const issue = project.activePokerSession.issues.id(req.params.issueId)
      if (!issue) return res.status(404).json({ message: "Issue not found" })

      issue.votes = []
      issue.status = "Not Started"
      await project.save()

      req.io.to(req.params.projectId).emit("votesReset", { issueId: req.params.issueId })

      res.status(200).json({ message: "Votes reset successfully" })
    } catch (error) {
      console.error("Error resetting votes:", error)
      res.status(500).json({ message: "Error resetting votes", error: error.message })
    }
  })

  // Updated validate route to handle sprint assignment and member assignment
  router.post("/:projectId/poker/issue/:issueId/validate", authenticateJWT, async (req, res) => {
    try {
      const { finalEstimate, sprintId, assignedTo } = req.body
      const project = await Project.findById(req.params.projectId)
      if (!project) return res.status(404).json({ message: "Project not found" })

      // Only project owner can validate
      if (project.owner.toString() !== req.user.id) {
        return res.status(403).json({ message: "Only the project owner can validate issues" })
      }

      const issue = project.activePokerSession.issues.id(req.params.issueId)
      if (!issue) return res.status(404).json({ message: "Issue not found" })

      // Update the issue with the final estimate and set status to "Finished"
      issue.finalEstimate = finalEstimate
      issue.status = "Finished"

      // Find the sprint to add the task to
      const sprint = project.sprints.id(sprintId)
      if (!sprint) {
        return res.status(404).json({ message: "Sprint not found" })
      }

      // Add the task to the selected sprint
      sprint.tasks.push({
        _id: issue._id,
        title: issue.title,
        description: issue.description,
        status: "To Do",
        priority: issue.priority || "Medium",
        assignedTo: assignedTo,
        finalEstimate,
      })

      // Update the corresponding backlog task if it exists
      const backlogTask = project.backlog.id(issue._id)
      if (backlogTask) {
        backlogTask.finalEstimate = finalEstimate
        backlogTask.assignedTo = assignedTo
      }

      await project.save()

      res.status(200).json({ message: "Session validated successfully" })
    } catch (error) {
      console.error("Error validating session:", error)
      res.status(500).json({ message: "Error validating session", error: error.message })
    }
  })

  router.post("/:projectId/poker/issue/:issueId/reveal", authenticateJWT, async (req, res) => {
    try {
      const project = await Project.findById(req.params.projectId).populate(
        "activePokerSession.issues.votes.user",
        "username",
      )
      if (!project) return res.status(404).json({ message: "Project not found" })

      const issue = project.activePokerSession.issues.id(req.params.issueId)
      if (!issue) return res.status(404).json({ message: "Issue not found" })

      issue.status = "Revealed"
      await project.save()

      // Get the populated votes to send to clients
      const populatedIssue = await Project.findById(req.params.projectId)
        .populate("activePokerSession.issues.votes.user", "username")
        .then((p) => p.activePokerSession.issues.id(req.params.issueId))

      console.log(`Emitting votesRevealed event to room ${req.params.projectId}:`, {
        issueId: req.params.issueId,
        votes: populatedIssue.votes,
        status: populatedIssue.status,
      })

      req.io.to(req.params.projectId).emit("votesRevealed", {
        issueId: req.params.issueId,
        votes: populatedIssue.votes,
        status: populatedIssue.status,
      })

      res.status(200).json({ message: "Votes revealed" })
    } catch (error) {
      console.error("Error revealing votes:", error)
      res.status(500).json({ message: "Error revealing votes", error: error.message })
    }
  })

  // Modified route to add a task to backlog and automatically create a poker issue
  router.post("/:projectId/backlog", authenticateJWT, async (req, res) => {
    try {
      const { title, description, priority, assignedTo, deadline } = req.body
      const project = await Project.findById(req.params.projectId)
      if (!project) return res.status(404).json({ message: "Project not found" })
      if (!project.members.map((m) => m._id.toString()).includes(req.user.id))
        return res.status(403).json({ message: "Unauthorized" })

      // Create a new task with a shared ID
      const taskId = new mongoose.Types.ObjectId()
      const newTask = {
        _id: taskId,
        title,
        description,
        priority,
        status: "To Do",
        assignedTo,
        deadline,
      }

      // Add to backlog
      project.backlog.push(newTask)

      // Ensure activePokerSession exists
      if (!project.activePokerSession) {
        project.activePokerSession = { issues: [] }
      }

      // Add the same task as a poker issue with the same ID
      const newPokerIssue = {
        ...newTask,
        status: "Not Started",
        votes: [],
      }
      project.activePokerSession.issues.push(newPokerIssue)

      await project.save()

      // Emit issueAdded event for real-time updates
      req.io.to(req.params.projectId).emit("issueAdded", { issue: newPokerIssue })

      res.status(201).json(project)
    } catch (error) {
      res.status(500).json({ message: "Error adding task to backlog", error: error.message })
    }
  })

  router.post("/:projectId/sprints", authenticateJWT, async (req, res) => {
    try {
      const { name, startDate, endDate, goals } = req.body
      const project = await Project.findById(req.params.projectId)
      if (!project) return res.status(404).json({ message: "Project not found" })
      if (!project.members.map((m) => m._id.toString()).includes(req.user.id.toString()))
        return res.status(403).json({ message: "Unauthorized" })
      project.sprints = project.sprints || []
      const newSprint = { name, tasks: [], active: true, startDate, endDate, goals }
      project.sprints.push(newSprint)
      await project.save()
      res.status(201).json({ message: "Sprint created", sprint: newSprint })
    } catch (error) {
      res.status(500).json({ message: "Error creating sprint", error: error.message })
    }
  })

  router.post("/:projectId/sprints/:sprintId/tasks", authenticateJWT, async (req, res) => {
    try {
      const { taskId, assignedTo, deadline } = req.body
      const project = await Project.findById(req.params.projectId)
      if (!project) return res.status(404).json({ message: "Project not found" })
      if (!project.members.map((m) => m._id.toString()).includes(req.user.id.toString()))
        return res.status(403).json({ message: "Unauthorized" })

      const sprint = project.sprints.id(req.params.sprintId)
      if (!sprint) return res.status(404).json({ message: "Sprint not found" })

      const task = project.backlog.id(taskId)
      if (!task) return res.status(404).json({ message: "Task not found" })

      sprint.tasks.push({ ...task.toObject(), assignedTo, deadline })
      project.backlog = project.backlog.filter((t) => t._id.toString() !== taskId)
      await project.save()
      res.status(201).json(project)
    } catch (error) {
      res.status(500).json({ message: "Error adding task to sprint", error: error.message })
    }
  })

  router.put("/:projectId/sprints/:sprintId/tasks/:taskId", authenticateJWT, async (req, res) => {
    try {
      const { status } = req.body
      const project = await Project.findById(req.params.projectId)
      if (!project) return res.status(404).json({ message: "Project not found" })
      if (!project.members.map((m) => m._id.toString()).includes(req.user.id.toString()))
        return res.status(403).json({ message: "Unauthorized" })

      const sprint = project.sprints.id(req.params.sprintId)
      if (!sprint) return res.status(404).json({ message: "Sprint not found" })

      const task = sprint.tasks.id(req.params.taskId)
      if (!task) return res.status(404).json({ message: "Task not found" })

      task.status = status
      await project.save()
      res.status(200).json(project)
    } catch (error) {
      res.status(500).json({ message: "Error updating task status", error: error.message })
    }
  })

  router.delete("/:projectId/backlog/:taskId", authenticateJWT, async (req, res) => {
    try {
      const project = await Project.findById(req.params.projectId)
      if (!project) return res.status(404).json({ message: "Project not found" })
      if (!project.members.map((m) => m._id.toString()).includes(req.user.id.toString()))
        return res.status(403).json({ message: "Unauthorized" })

      project.backlog = project.backlog.filter((task) => task._id.toString() !== req.params.taskId)

      // Also remove from poker session if it exists
      if (project.activePokerSession && project.activePokerSession.issues) {
        const issueIndex = project.activePokerSession.issues.findIndex(
          (issue) => issue._id.toString() === req.params.taskId,
        )

        if (issueIndex !== -1) {
          project.activePokerSession.issues.splice(issueIndex, 1)
          // Emit issue deleted event
          req.io.to(req.params.projectId).emit("issueDeleted", { issueId: req.params.taskId })
        }
      }

      await project.save()
      res.status(200).json(project)
    } catch (error) {
      res.status(500).json({ message: "Error deleting task", error: error.message })
    }
  })

  router.delete("/:projectId/sprints/:sprintId", authenticateJWT, async (req, res) => {
    try {
      const project = await Project.findById(req.params.projectId)
      if (!project) return res.status(404).json({ message: "Project not found" })
      if (!project.members.map((m) => m._id.toString()).includes(req.user.id.toString()))
        return res.status(403).json({ message: "Unauthorized" })

      project.sprints = project.sprints.filter((sprint) => sprint._id.toString() !== req.params.sprintId)
      await project.save()
      res.status(200).json(project)
    } catch (error) {
      res.status(500).json({ message: "Error deleting sprint", error: error.message })
    }
  })

  router.delete("/:projectId/sprints/:sprintId/tasks/:taskId", authenticateJWT, async (req, res) => {
    try {
      const project = await Project.findById(req.params.projectId)
      if (!project) return res.status(404).json({ message: "Project not found" })
      if (!project.members.map((m) => m._id.toString()).includes(req.user.id.toString()))
        return res.status(403).json({ message: "Unauthorized" })

      const sprint = project.sprints.id(req.params.sprintId)
      if (!sprint) return res.status(404).json({ message: "Sprint not found" })

      sprint.tasks = sprint.tasks.filter((task) => task._id.toString() !== req.params.taskId)
      await project.save()
      res.status(200).json(project)
    } catch (error) {
      res.status(500).json({ message: "Error deleting task", error: error.message })
    }
  })

  router.delete("/:projectId/poker/issue/:issueId", authenticateJWT, async (req, res) => {
    const { projectId, issueId } = req.params
    try {
      const project = await Project.findById(projectId)
      if (!project) {
        return res.status(404).json({ message: "Project not found" })
      }
      if (!project.members.map((m) => m._id.toString()).includes(req.user.id)) {
        return res.status(403).json({ message: "Unauthorized" })
      }
      const issueIndex = project.activePokerSession?.issues?.findIndex((issue) => issue._id.toString() === issueId)
      if (issueIndex === -1 || issueIndex === undefined) {
        return res.status(404).json({ message: "Issue not found" })
      }
      project.activePokerSession.issues.splice(issueIndex, 1)
      await project.save()
      console.log(`Emitting issueDeleted event to room ${projectId} for issue ${issueId}`)
      req.io.to(projectId).emit("issueDeleted", { issueId })
      res.status(200).json({ message: "Issue deleted successfully" })
    } catch (error) {
      console.error("Error deleting issue:", error)
      res.status(500).json({ message: "Error deleting issue", error: error.message })
    }
  })

  return router
}

