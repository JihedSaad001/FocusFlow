const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// Models
const Project = require("../models/Project");
const User = require("../models/User");

// Middleware
const { authenticateJWT, isAdmin } = require("../middleware/authMiddleware");

module.exports = (io) => {
  // Pass Socket.IO to routes that need it
  router.use((req, res, next) => {
    req.io = io;
    next();
  });

  // ==================== Project Management Routes ====================

  /**
   * @route   POST /api/projects/
   * @desc    Create a new project
   * @access  Private
   */
  router.post("/", authenticateJWT, async (req, res) => {
    try {
      const { name, description } = req.body;
      const newProject = new Project({
        name,
        description,
        owner: req.user.id,
        members: [req.user.id],
      });

      await newProject.save();
      res.status(201).json(newProject);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Error creating project", error: error.message });
    }
  });

  /**
   * @route   GET /api/projects/
   * @desc    Get all projects for a user
   * @access  Private
   */
  router.get("/", authenticateJWT, async (req, res) => {
    try {
      const projects = await Project.find({ members: req.user.id }).populate("members", "username email");
      res.status(200).json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Error fetching projects", error: error.message });
    }
  });

  /**
   * @route   GET /api/projects/:projectId
   * @desc    Get a specific project by ID
   * @access  Private
   */
  router.get("/:projectId", authenticateJWT, async (req, res) => {
    try {
      const project = await Project.findById(req.params.projectId)
        .populate("members", "username email")
        .populate("owner", "username");
      if (!project) return res.status(404).json({ message: "Project not found" });
      console.log(
        "User ID:",
        req.user.id,
        "Project Members:",
        project.members.map((m) => m._id.toString()),
      );
      if (!project.members.map((m) => m._id.toString()).includes(req.user.id))
        return res.status(403).json({ message: "Unauthorized" });
      res.status(200).json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Error fetching project", error: error.message });
    }
  });

  /**
   * @route   PUT /api/projects/:projectId
   * @desc    Update a project
   * @access  Private
   */
  router.put("/:projectId", authenticateJWT, async (req, res) => {
    try {
      const projectId = req.params.projectId;
      const { name, description } = req.body;
      const userId = req.user.id;

      const project = await Project.findById(projectId);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      if (project.owner.toString() !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      project.name = name;
      project.description = description;

      await project.save();
      res.status(200).json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Error updating project", error: error.message });
    }
  });

  /**
   * @route   DELETE /api/projects/:projectId
   * @desc    Delete a project
   * @access  Private
   */
  router.delete("/:projectId", authenticateJWT, async (req, res) => {
    try {
      const project = await Project.findById(req.params.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      if (!project.members.map((m) => m._id.toString()).includes(req.user.id.toString())) {
        return res.status(403).json({ message: "Unauthorized to delete this project" });
      }

      if (project.owner._id.toString() !== req.user.id.toString()) {
        return res.status(403).json({ message: "Only the project owner can delete this project" });
      }

      await Project.deleteOne({ _id: req.params.projectId });
      res.status(200).json({ message: "Project deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting project", error: error.message });
    }
  });

  /**
   * @route   POST /api/projects/:projectId/members
   * @desc    Add a member to a project
   * @access  Private
   */
  router.post("/:projectId/members", authenticateJWT, async (req, res) => {
    try {
      const { email } = req.body;
      const project = await Project.findById(req.params.projectId);
      if (!project) return res.status(404).json({ message: "Project not found" });

      if (project.owner.toString() !== req.user.id)
        return res.status(403).json({ message: "Only the project owner can invite members" });

      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });

      if (!project.members.includes(user._id)) {
        project.members.push(user._id);
        await project.save();
      }

      res.status(200).json({ message: "User invited successfully", project });
    } catch (error) {
      res.status(500).json({ message: "Error inviting user", error: error.message });
    }
  });

  /**
   * @route   DELETE /api/projects/:projectId/members/:memberId
   * @desc    Remove a member from a project
   * @access  Private
   */
  router.delete("/:projectId/members/:memberId", authenticateJWT, async (req, res) => {
    try {
      const project = await Project.findById(req.params.projectId)
        .populate("owner", "username")
        .populate("members", "username email");
      if (!project) return res.status(404).json({ message: "Project not found" });

      if (project.owner._id.toString() !== req.user.id) {
        return res.status(403).json({ message: "Only the project owner can remove members" });
      }

      if (req.params.memberId === req.user.id) {
        return res.status(400).json({ message: "You cannot remove yourself from the project" });
      }

      const memberIndex = project.members.findIndex((member) => member._id.toString() === req.params.memberId);
      if (memberIndex === -1) {
        return res.status(404).json({ message: "Member not found in project" });
      }

      project.members.splice(memberIndex, 1);
      await project.save();

      const updatedProject = await Project.findById(req.params.projectId)
        .populate("owner", "username")
        .populate("members", "username email");

      res.status(200).json({ message: "Member removed successfully", project: updatedProject });
    } catch (error) {
      res.status(500).json({ message: "Error removing member", error: error.message });
    }
  });

  /**
   * @route   GET /api/projects/stats/projects
   * @desc    Get project statistics
   * @access  Private (Admin)
   */
  router.get("/stats/projects", authenticateJWT, isAdmin, async (req, res) => {
    try {
      const totalProjects = await Project.countDocuments();

      res.status(200).json({
        totalProjects,
      });
    } catch (error) {
      console.error("Error fetching project statistics:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });

  // ==================== Project Poker Routes ====================

  /**
   * @route   POST /api/projects/:projectId/poker/start
   * @desc    Start a poker session
   * @access  Private
   */
  router.post("/:projectId/poker/start", authenticateJWT, async (req, res) => {
    try {
      const project = await Project.findById(req.params.projectId);
      if (!project) return res.status(404).json({ message: "Project not found" });

      if (!project.activePokerSession) {
        project.activePokerSession = { issues: [] };
      }

      await project.save();
      res.status(201).json({ message: "Poker session started" });
    } catch (error) {
      res.status(500).json({ message: "Error starting poker session", error: error.message });
    }
  });

  /**
   * @route   GET /api/projects/:projectId/poker
   * @desc    Get the poker session
   * @access  Private
   */
  router.get("/:projectId/poker", authenticateJWT, async (req, res) => {
    console.log("Incoming request to fetch poker session for project", req.params.projectId);
    try {
      const project = await Project.findById(req.params.projectId)
        .populate("members", "username")
        .populate("activePokerSession.issues.votes.user", "username");
      if (!project) {
        console.log("Project not found");
        return res.status(404).json({ message: "Project not found" });
      }
      if (!project.members.map((m) => m._id.toString()).includes(req.user.id)) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      res.status(200).json(project.activePokerSession);
    } catch (error) {
      console.error("Error fetching poker session:", error);
      res.status(500).json({ message: "Error fetching poker session", error: error.message });
    }
  });

  /**
   * @route   POST /api/projects/:projectId/poker/issue
   * @desc    Add an issue to the poker session
   * @access  Private
   */
  router.post("/:projectId/poker/issue", authenticateJWT, async (req, res) => {
    const { projectId } = req.params;
    const { title, description } = req.body;
    try {
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      if (!project.members.map((m) => m._id.toString()).includes(req.user.id)) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      if (!project.activePokerSession) {
        project.activePokerSession = { issues: [] };
      }
      const newIssue = { _id: new mongoose.Types.ObjectId(), title, description, status: "Not Started", votes: [] };
      project.activePokerSession.issues.push(newIssue);
      await project.save();

      const savedIssue = project.activePokerSession.issues.find(
        (i) => i.title === title && i.description === description,
      );

      console.log(`Emitting issueAdded event to room ${projectId} for issue ${savedIssue._id}`);
      req.io.to(projectId).emit("issueAdded", { issue: savedIssue });

      res.status(201).json(savedIssue);
    } catch (error) {
      console.error("Error adding issue:", error);
      res.status(500).json({ message: "Error adding issue", error: error.message });
    }
  });

  /**
   * @route   POST /api/projects/:projectId/poker/issue/:issueId/vote
   * @desc    Record a vote for an issue
   * @access  Private
   */
  router.post("/:projectId/poker/issue/:issueId/vote", authenticateJWT, async (req, res) => {
    const { projectId, issueId } = req.params;
    const { vote } = req.body;
    const userId = req.user.id;

    try {
      const project = await Project.findById(projectId).populate("members", "username");
      if (!project || !project.activePokerSession) {
        return res.status(404).json({ message: "Project or poker session not found" });
      }

      if (!project.members.map((m) => m._id.toString()).includes(userId)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const issue = project.activePokerSession.issues.find((i) => i._id.toString() === issueId);
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }

      const existingVoteIndex = issue.votes.findIndex((v) => v.user.toString() === userId);
      if (existingVoteIndex !== -1) {
        issue.votes[existingVoteIndex].vote = vote;
        console.log(`Updated vote for user ${userId} to ${vote} on issue ${issueId}`);
      } else {
        issue.votes.push({ user: userId, vote });
        console.log(`Added vote ${vote} for user ${userId} on issue ${issueId}`);
      }

      await project.save();
      console.log(`Saved votes for issue ${issueId}:`, issue.votes);

      const votingUser = project.members.find((m) => m._id.toString() === userId);

      const username = votingUser ? votingUser.username : "Unknown";
      console.log(`Emitting voteUpdate event to room ${projectId}:`, {
        issueId,
        vote,
        userId,
        username,
        totalVotes: issue.votes.length,
      });

      req.io.to(projectId).emit("voteUpdate", {
        issueId,
        vote,
        userId,
        username,
        totalVotes: issue.votes.length,
      });

      res.status(200).json({ message: "Vote recorded successfully" });
    } catch (error) {
      console.error("Error recording vote:", error);
      res.status(500).json({ message: "Error recording vote", error: error.message });
    }
  });

  /**
   * @route   POST /api/projects/:projectId/poker/issue/:issueId/revote
   * @desc    Reset votes for an issue
   * @access  Private
   */
  router.post("/:projectId/poker/issue/:issueId/revote", authenticateJWT, async (req, res) => {
    try {
      const project = await Project.findById(req.params.projectId);
      if (!project) return res.status(404).json({ message: "Project not found" });

      if (project.owner.toString() !== req.user.id) {
        return res.status(403).json({ message: "Only the project owner can reset votes" });
      }

      const issue = project.activePokerSession.issues.id(req.params.issueId);
      if (!issue) return res.status(404).json({ message: "Issue not found" });

      issue.votes = [];
      issue.status = "Not Started";
      await project.save();

      req.io.to(req.params.projectId).emit("votesReset", { issueId: req.params.issueId });

      res.status(200).json({ message: "Votes reset successfully" });
    } catch (error) {
      console.error("Error resetting votes:", error);
      res.status(500).json({ message: "Error resetting votes", error: error.message });
    }
  });

  /**
   * @route   POST /api/projects/:projectId/poker/issue/:issueId/reveal
   * @desc    Reveal votes for an issue
   * @access  Private
   */
  router.post("/:projectId/poker/issue/:issueId/reveal", authenticateJWT, async (req, res) => {
    try {
      const project = await Project.findById(req.params.projectId).populate(
        "activePokerSession.issues.votes.user",
        "username",
      );
      if (!project) return res.status(404).json({ message: "Project not found" });

      const issue = project.activePokerSession.issues.id(req.params.issueId);
      if (!issue) return res.status(404).json({ message: "Issue not found" });

      issue.status = "Revealed";
      await project.save();

      const populatedIssue = await Project.findById(req.params.projectId)
        .populate("activePokerSession.issues.votes.user", "username")
        .then((p) => p.activePokerSession.issues.id(req.params.issueId));

      console.log(`Emitting votesRevealed event to room ${req.params.projectId}:`, {
        issueId: req.params.issueId,
        votes: populatedIssue.votes,
        status: populatedIssue.status,
      });

      req.io.to(req.params.projectId).emit("votesRevealed", {
        issueId: req.params.issueId,
        votes: populatedIssue.votes,
        status: populatedIssue.status,
      });

      res.status(200).json({ message: "Votes revealed" });
    } catch (error) {
      console.error("Error revealing votes:", error);
      res.status(500).json({ message: "Error revealing votes", error: error.message });
    }
  });

  /**
   * @route   POST /api/projects/:projectId/poker/issue/:issueId/validate
   * @desc    Validate an issue and add to sprint
   * @access  Private
   */
  router.post("/:projectId/poker/issue/:issueId/validate", authenticateJWT, async (req, res) => {
    try {
      const { finalEstimate, sprintId, assignedTo, delay } = req.body;
      const project = await Project.findById(req.params.projectId);
      if (!project) return res.status(404).json({ message: "Project not found" });

      if (project.owner.toString() !== req.user.id) {
        return res.status(403).json({ message: "Only the project owner can validate issues" });
      }

      const issue = project.activePokerSession.issues.id(req.params.issueId);
      if (!issue) return res.status(404).json({ message: "Issue not found" });

      issue.finalEstimate = finalEstimate;
      issue.status = "Finished";
      issue.assignedTo = assignedTo;

      const sprint = project.sprints.id(sprintId);
      if (!sprint) {
        return res.status(404).json({ message: "Sprint not found" });
      }

      let deadline = null;
      if (delay !== undefined && !isNaN(delay) && delay >= 0) {
        const currentDate = new Date();
        deadline = new Date(currentDate.setDate(currentDate.getDate() + delay));
      }

      sprint.tasks.push({
        _id: issue._id,
        title: issue.title,
        description: issue.description,
        status: "To Do",
        priority: issue.priority || "Medium",
        assignedTo: assignedTo,
        deadline,
        finalEstimate,
      });

      project.activePokerSession.issues = project.activePokerSession.issues.filter(
        (i) => i._id.toString() !== req.params.issueId
      );

      project.backlog = project.backlog.filter(
        (task) => task._id.toString() !== req.params.issueId
      );

      await project.save();

      req.io.to(req.params.projectId).emit("issueDeleted", { issueId: req.params.issueId });

      res.status(200).json({ message: "Issue validated, added to sprint, and removed from poker session and backlog successfully" });
    } catch (error) {
      console.error("Error validating session:", error);
      res.status(500).json({ message: "Error validating session", error: error.message });
    }
  });

  /**
   * @route   POST /api/projects/:projectId/poker/batch-validate
   * @desc    Batch validate poker issues
   * @access  Private
   */
  router.post("/:projectId/poker/batch-validate", authenticateJWT, async (req, res) => {
    try {
      const { issues } = req.body;
      const projectId = req.params.projectId;
      const userId = req.user.id;

      if (!issues || !Array.isArray(issues) || issues.length === 0) {
        return res.status(400).json({ message: "Issues array is required and must not be empty" });
      }

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      if (project.owner.toString() !== userId) {
        return res.status(403).json({ message: "Only the project owner can validate issues" });
      }

      const validatedIssueIds = [];
      for (const issueData of issues) {
        const { issueId, finalEstimate, sprintId, assignedTo, delay } = issueData;

        if (!issueId || !sprintId || !finalEstimate || !assignedTo) {
          return res.status(400).json({ message: "Missing required fields for issue validation" });
        }

        const issue = project.activePokerSession?.issues?.find(
          (i) => i._id.toString() === issueId
        );
        if (!issue) {
          return res.status(404).json({ message: `Issue ${issueId} not found in poker session` });
        }

        const sprint = project.sprints.id(sprintId);
        if (!sprint) {
          return res.status(404).json({ message: `Sprint ${sprintId} not found` });
        }

        let deadline = null;
        if (delay !== undefined && !isNaN(delay) && delay >= 0) {
          const currentDate = new Date();
          deadline = new Date(currentDate.setDate(currentDate.getDate() + delay));
        }

        sprint.tasks.push({
          _id: issue._id,
          title: issue.title,
          description: issue.description,
          status: "To Do",
          priority: issue.priority || "Medium",
          assignedTo,
          deadline,
          finalEstimate,
        });

        issue.status = "Finished";
        issue.finalEstimate = finalEstimate;
        issue.assignedTo = assignedTo;

        validatedIssueIds.push(issueId);
      }

      project.activePokerSession.issues = project.activePokerSession.issues.filter(
        (issue) => !validatedIssueIds.includes(issue._id.toString())
      );

      project.backlog = project.backlog.filter(
        (task) => !validatedIssueIds.includes(task._id.toString())
      );

      await project.save();

      for (const issueId of validatedIssueIds) {
        req.io.to(projectId).emit("issueDeleted", { issueId });
      }

      res.status(200).json({ message: "Issues validated, added to sprints, and removed from poker session and backlog successfully" });
    } catch (error) {
      console.error("Error batch validating issues:", error);
      res.status(500).json({ message: "Error batch validating issues", error: error.message });
    }
  });

  // ==================== Project Sprint Routes ====================

  /**
   * @route   POST /api/projects/:projectId/sprints
   * @desc    Create a new sprint
   * @access  Private
   */
  router.post("/:projectId/sprints", authenticateJWT, async (req, res) => {
    try {
      const { name, startDate, endDate } = req.body;
      const project = await Project.findById(req.params.projectId);

      if (!project) return res.status(404).json({ message: "Project not found" });
      if (project.owner.toString() !== req.user.id) {
        return res.status(403).json({ message: "Only the project owner can create sprints" });
      }

      const sprint = {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        tasks: [],
      };

      project.sprints.push(sprint);
      await project.save();

      res.status(201).json(project.sprints[project.sprints.length - 1]);
    } catch (error) {
      console.error("Error creating sprint:", error);
      res.status(500).json({ message: "Error creating sprint", error: error.message });
    }
  });

  /**
   * @route   GET /api/projects/:projectId/sprints
   * @desc    Get all sprints for a project
   * @access  Private
   */
  router.get("/:projectId/sprints", authenticateJWT, async (req, res) => {
    try {
      const project = await Project.findById(req.params.projectId);
      if (!project) return res.status(404).json({ message: "Project not found" });
      if (!project.members.map((m) => m._id.toString()).includes(req.user.id)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      res.status(200).json(project.sprints);
    } catch (error) {
      console.error("Error fetching sprints:", error);
      res.status(500).json({ message: "Error fetching sprints", error: error.message });
    }
  });

  /**
   * @route   PUT /api/projects/:projectId/sprints/:sprintId
   * @desc    Update a sprint
   * @access  Private
   */
  router.put("/:projectId/sprints/:sprintId", authenticateJWT, async (req, res) => {
    try {
      const { name, startDate, endDate } = req.body;
      const project = await Project.findById(req.params.projectId);

      if (!project) return res.status(404).json({ message: "Project not found" });
      if (project.owner.toString() !== req.user.id) {
        return res.status(403).json({ message: "Only the project owner can update sprints" });
      }

      const sprint = project.sprints.id(req.params.sprintId);
      if (!sprint) return res.status(404).json({ message: "Sprint not found" });

      sprint.name = name || sprint.name;
      sprint.startDate = startDate ? new Date(startDate) : sprint.startDate;
      sprint.endDate = endDate ? new Date(endDate) : sprint.endDate;

      await project.save();
      res.status(200).json(sprint);
    } catch (error) {
      console.error("Error updating sprint:", error);
      res.status(500).json({ message: "Error updating sprint", error: error.message });
    }
  });

  /**
   * @route   DELETE /api/projects/:projectId/sprints/:sprintId
   * @desc    Delete a sprint
   * @access  Private
   */
  router.delete("/:projectId/sprints/:sprintId", authenticateJWT, async (req, res) => {
    try {
      const project = await Project.findById(req.params.projectId);
      if (!project) return res.status(404).json({ message: "Project not found" });
      if (project.owner.toString() !== req.user.id) {
        return res.status(403).json({ message: "Only the project owner can delete sprints" });
      }

      const sprint = project.sprints.id(req.params.sprintId);
      if (!sprint) return res.status(404).json({ message: "Sprint not found" });

      project.sprints.pull({ _id: req.params.sprintId });
      await project.save();

      res.status(200).json({ message: "Sprint deleted successfully" });
    } catch (error) {
      console.error("Error deleting sprint:", error);
      res.status(500).json({ message: "Error deleting sprint", error: error.message });
    }
  });

  /**
   * @route   POST /api/projects/:projectId/sprints/:sprintId/tasks
   * @desc    Add a task to a sprint
   * @access  Private
   */
  router.post("/:projectId/sprints/:sprintId/tasks", authenticateJWT, async (req, res) => {
    try {
      const { title, description, assignedTo, priority, deadline } = req.body;
      const project = await Project.findById(req.params.projectId);

      if (!project) return res.status(404).json({ message: "Project not found" });
      if (!project.members.map((m) => m._id.toString()).includes(req.user.id)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const sprint = project.sprints.id(req.params.sprintId);
      if (!sprint) return res.status(404).json({ message: "Sprint not found" });

      const task = {
        title,
        description,
        status: "To Do",
        priority: priority || "Medium",
        assignedTo,
        deadline: deadline ? new Date(deadline) : null,
      };

      sprint.tasks.push(task);
      await project.save();

      res.status(201).json(sprint.tasks[sprint.tasks.length - 1]);
    } catch (error) {
      console.error("Error adding task to sprint:", error);
      res.status(500).json({ message: "Error adding task to sprint", error: error.message });
    }
  });

  /**
   * @route   PUT /api/projects/:projectId/sprints/:sprintId/tasks/:taskId
   * @desc    Update a task in a sprint
   * @access  Private
   */
  router.put("/:projectId/sprints/:sprintId/tasks/:taskId", authenticateJWT, async (req, res) => {
    try {
      const { title, description, status, assignedTo, priority, deadline } = req.body;
      const project = await Project.findById(req.params.projectId);

      if (!project) return res.status(404).json({ message: "Project not found" });
      if (!project.members.map((m) => m._id.toString()).includes(req.user.id)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const sprint = project.sprints.id(req.params.sprintId);
      if (!sprint) return res.status(404).json({ message: "Sprint not found" });

      const task = sprint.tasks.id(req.params.taskId);
      if (!task) return res.status(404).json({ message: "Task not found" });

      task.title = title || task.title;
      task.description = description || task.description;
      task.status = status || task.status;
      task.assignedTo = assignedTo || task.assignedTo;
      task.priority = priority || task.priority;
      task.deadline = deadline ? new Date(deadline) : task.deadline;

      await project.save();
      res.status(200).json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Error updating task", error: error.message });
    }
  });

  /**
   * @route   DELETE /api/projects/:projectId/sprints/:sprintId/tasks/:taskId
   * @desc    Delete a task from a sprint
   * @access  Private
   */
  router.delete("/:projectId/sprints/:sprintId/tasks/:taskId", authenticateJWT, async (req, res) => {
    try {
      const project = await Project.findById(req.params.projectId);
      if (!project) return res.status(404).json({ message: "Project not found" });
      if (!project.members.map((m) => m._id.toString()).includes(req.user.id)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const sprint = project.sprints.id(req.params.sprintId);
      if (!sprint) return res.status(404).json({ message: "Sprint not found" });

      const task = sprint.tasks.id(req.params.taskId);
      if (!task) return res.status(404).json({ message: "Task not found" });

      sprint.tasks.pull({ _id: req.params.taskId });
      await project.save();

      res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Error deleting task", error: error.message });
    }
  });

  // ==================== Project Backlog Routes ====================

  /**
   * @route   POST /api/projects/:projectId/backlog
   * @desc    Add a task to the project backlog
   * @access  Private
   */
  router.post("/:projectId/backlog", authenticateJWT, async (req, res) => {
    try {
      const { title, description, priority } = req.body;
      const project = await Project.findById(req.params.projectId);

      if (!project) return res.status(404).json({ message: "Project not found" });
      if (!project.members.map((m) => m._id.toString()).includes(req.user.id)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const task = {
        title,
        description,
        priority: priority || "Medium",
      };

      project.backlog.push(task);
      await project.save();

      res.status(201).json(project.backlog[project.backlog.length - 1]);
    } catch (error) {
      console.error("Error adding task to backlog:", error);
      res.status(500).json({ message: "Error adding task to backlog", error: error.message });
    }
  });

  /**
   * @route   GET /api/projects/:projectId/backlog
   * @desc    Get all tasks in the project backlog
   * @access  Private
   */
  router.get("/:projectId/backlog", authenticateJWT, async (req, res) => {
    try {
      const project = await Project.findById(req.params.projectId);
      if (!project) return res.status(404).json({ message: "Project not found" });
      if (!project.members.map((m) => m._id.toString()).includes(req.user.id)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      res.status(200).json(project.backlog);
    } catch (error) {
      console.error("Error fetching backlog:", error);
      res.status(500).json({ message: "Error fetching backlog", error: error.message });
    }
  });

  /**
   * @route   PUT /api/projects/:projectId/backlog/:taskId
   * @desc    Update a task in the backlog
   * @access  Private
   */
  router.put("/:projectId/backlog/:taskId", authenticateJWT, async (req, res) => {
    try {
      const { title, description, priority } = req.body;
      const project = await Project.findById(req.params.projectId);

      if (!project) return res.status(404).json({ message: "Project not found" });
      if (!project.members.map((m) => m._id.toString()).includes(req.user.id)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const task = project.backlog.id(req.params.taskId);
      if (!task) return res.status(404).json({ message: "Task not found" });

      task.title = title || task.title;
      task.description = description || task.description;
      task.priority = priority || task.priority;

      await project.save();
      res.status(200).json(task);
    } catch (error) {
      console.error("Error updating backlog task:", error);
      res.status(500).json({ message: "Error updating backlog task", error: error.message });
    }
  });

  /**
   * @route   DELETE /api/projects/:projectId/backlog/:taskId
   * @desc    Delete a task from the backlog
   * @access  Private
   */
  router.delete("/:projectId/backlog/:taskId", authenticateJWT, async (req, res) => {
    try {
      const project = await Project.findById(req.params.projectId);
      if (!project) return res.status(404).json({ message: "Project not found" });
      if (!project.members.map((m) => m._id.toString()).includes(req.user.id)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const task = project.backlog.id(req.params.taskId);
      if (!task) return res.status(404).json({ message: "Task not found" });

      project.backlog.pull({ _id: req.params.taskId });
      await project.save();

      res.status(200).json({ message: "Task deleted from backlog successfully" });
    } catch (error) {
      console.error("Error deleting backlog task:", error);
      res.status(500).json({ message: "Error deleting backlog task", error: error.message });
    }
  });

  return router;
};