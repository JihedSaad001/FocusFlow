const mongoose = require("mongoose");
const Project = require("../models/Project");
const User = require("../models/User");

/**
 * Create a new project
 */
exports.createProject = async (req, res) => {
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
};

/**
 * Get all projects for a user
 */
exports.getUserProjects = async (req, res) => {
  try {
    const projects = await Project.find({ members: req.user.id }).populate("members", "username email");
    res.status(200).json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Error fetching projects", error: error.message });
  }
};

/**
 * Get a specific project by ID
 */
exports.getProjectById = async (req, res) => {
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
};

/**
 * Update a project
 */
exports.updateProject = async (req, res) => {
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
};

/**
 * Delete a project
 */
exports.deleteProject = async (req, res) => {
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

    await Project.findByIdAndDelete(req.params.projectId);
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ message: "Error deleting project", error: error.message });
  }
};

/**
 * Add a member to a project
 */
exports.addProjectMember = async (req, res) => {
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

    const updatedProject = await Project.findById(req.params.projectId).populate("members", "username email");
    res.status(200).json(updatedProject);
  } catch (error) {
    console.error("Error adding member:", error);
    res.status(500).json({ message: "Error adding member", error: error.message });
  }
};

/**
 * Remove a member from a project
 */
exports.removeProjectMember = async (req, res) => {
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

    project.members = project.members.filter((member) => member._id.toString() !== req.params.memberId);
    await project.save();

    res.status(200).json(project);
  } catch (error) {
    console.error("Error removing member:", error);
    res.status(500).json({ message: "Error removing member", error: error.message });
  }
};

/**
 * Start a poker session
 */
exports.startPokerSession = async (req, res) => {
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
};

/**
 * Get the poker session
 */
exports.getPokerSession = async (req, res) => {
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

    res.status(200).json(project.activePokerSession || { issues: [] });
  } catch (error) {
    console.error("Error fetching poker session:", error);
    res.status(500).json({ message: "Error fetching poker session", error: error.message });
  }
};

/**
 * Add an issue to the poker session
 */
exports.addPokerIssue = async (req, res) => {
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

    const newIssue = {
      _id: new mongoose.Types.ObjectId(),
      title,
      description,
      status: "Not Started",
      votes: [],
    };

    project.activePokerSession.issues.push(newIssue);
    await project.save();

    // Emit issueAdded event for real-time updates
    req.io.to(projectId).emit("issueAdded", { issue: newIssue });

    res.status(201).json(newIssue);
  } catch (error) {
    console.error("Error adding issue:", error);
    res.status(500).json({ message: "Error adding issue", error: error.message });
  }
};

/**
 * Record a vote for an issue
 */
exports.voteOnPokerIssue = async (req, res) => {
  const { projectId, issueId } = req.params;
  const { vote } = req.body;
  const userId = req.user.id;

  console.log(`[DEBUG] Vote received - Project: ${projectId}, Issue: ${issueId}, User: ${userId}, Vote: ${vote}`);

  try {
    console.log(`[DEBUG] Finding project ${projectId} and populating members`);
    const project = await Project.findById(projectId).populate("members", "username");
    if (!project || !project.activePokerSession) {
      console.log(`[DEBUG] Project or poker session not found - Project exists: ${!!project}, Poker session exists: ${!!project?.activePokerSession}`);
      return res.status(404).json({ message: "Project or poker session not found" });
    }

    const memberIds = project.members.map((m) => m._id.toString());
    console.log(`[DEBUG] Project members: ${memberIds.join(', ')}`);
    console.log(`[DEBUG] Checking if user ${userId} is a member of the project`);

    if (!memberIds.includes(userId)) {
      console.log(`[DEBUG] User ${userId} is not authorized to vote on this project`);
      return res.status(403).json({ message: "Unauthorized" });
    }

    console.log(`[DEBUG] Finding issue ${issueId} in the poker session`);
    const issue = project.activePokerSession.issues.find((i) => i._id.toString() === issueId);
    if (!issue) {
      console.log(`[DEBUG] Issue ${issueId} not found in the poker session`);
      return res.status(404).json({ message: "Issue not found" });
    }

    console.log(`[DEBUG] Current issue status: ${issue.status}, Votes count: ${issue.votes.length}`);

    // Check if user has already voted
    const existingVoteIndex = issue.votes.findIndex((v) => v.user.toString() === userId);
    if (existingVoteIndex !== -1) {
      // Update existing vote
      const oldVote = issue.votes[existingVoteIndex].vote;
      console.log(`[DEBUG] User ${userId} has already voted: ${oldVote}. Updating to: ${vote}`);
      issue.votes[existingVoteIndex].vote = vote;
    } else {
      // Add new vote
      console.log(`[DEBUG] User ${userId} is voting for the first time with: ${vote}`);
      issue.votes.push({ user: userId, vote });
    }

    // Update issue status to Voting
    issue.status = "Voting";
    console.log(`[DEBUG] Updated issue status to: ${issue.status}, New votes count: ${issue.votes.length}`);

    console.log(`[DEBUG] Saving project with updated votes`);
    await project.save();

    // Get the populated votes to send to clients
    console.log(`[DEBUG] Fetching populated issue to send to clients`);
    const populatedIssue = await Project.findById(projectId)
      .populate("activePokerSession.issues.votes.user", "username")
      .then((p) => p.activePokerSession.issues.id(issueId));

    if (!populatedIssue) {
      console.log(`[DEBUG] Failed to retrieve populated issue after saving`);
      return res.status(500).json({ message: "Error retrieving updated issue" });
    }

    console.log(`[DEBUG] Populated issue retrieved successfully. Votes count: ${populatedIssue.votes.length}`);

    // Emit voteRecorded event for real-time updates
    console.log(`[DEBUG] Emitting voteRecorded event to room ${projectId} with data:`, {
      issueId,
      votesCount: populatedIssue.votes.length,
      status: populatedIssue.status,
    });

    req.io.to(projectId).emit("voteRecorded", {
      issueId,
      votes: populatedIssue.votes,
      status: populatedIssue.status,
    });

    // Check if the socket.io adapter is working
    console.log(`[DEBUG] Socket.IO adapter type: ${req.io.adapter.constructor.name}`);
    console.log(`[DEBUG] Socket.IO rooms for project ${projectId}:`, req.io.sockets.adapter.rooms.get(projectId));

    res.status(200).json({ message: "Vote recorded", issue: populatedIssue });
  } catch (error) {
    console.error("Error recording vote:", error);
    res.status(500).json({ message: "Error recording vote", error: error.message });
  }
};

/**
 * Fetch chat messages
 */
exports.getChatMessages = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId).populate("chatMessages.user", "username profilePic");
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!project.members.map((m) => m._id.toString()).includes(req.user.id))
      return res.status(403).json({ message: "Unauthorized" });
    res.status(200).json(project.chatMessages || []);
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    res.status(500).json({ message: "Error fetching chat messages", error: error.message });
  }
};

/**
 * Request revote for a poker issue
 */
exports.requestRevote = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the project owner can reset votes" });
    }

    const issue = project.activePokerSession.issues.id(req.params.issueId);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    // Clear votes and reset status
    issue.votes = [];
    issue.status = "Not Started";
    await project.save();

    // Emit voteReset event for real-time updates
    req.io.to(req.params.projectId).emit("voteReset", { issueId: req.params.issueId });

    res.status(200).json({ message: "Votes reset successfully" });
  } catch (error) {
    console.error("Error resetting votes:", error);
    res.status(500).json({ message: "Error resetting votes", error: error.message });
  }
};

/**
 * Batch validate poker issues
 */
exports.batchValidatePokerIssues = async (req, res) => {
  try {
    const { issues } = req.body;
    const projectId = req.params.projectId;
    const userId = req.user.id;

    // Validate request body
    if (!issues || !Array.isArray(issues) || issues.length === 0) {
      return res.status(400).json({ message: "Issues array is required and must not be empty" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Only project owner can validate
    if (project.owner.toString() !== userId) {
      return res.status(403).json({ message: "Only the project owner can validate issues" });
    }

    // Extract issue IDs and their final estimates
    const validatedIssues = issues.map((issue) => ({
      issueId: issue.issueId,
      finalEstimate: issue.finalEstimate,
      sprintId: issue.sprintId,
      assignedTo: issue.assignedTo,
      deadline: issue.deadline,
    }));

    const validatedIssueIds = validatedIssues.map((issue) => issue.issueId);

    // Find the sprint if sprintId is provided
    for (const validatedIssue of validatedIssues) {
      if (validatedIssue.sprintId) {
        const sprint = project.sprints.id(validatedIssue.sprintId);
        if (!sprint) {
          return res.status(404).json({ message: `Sprint with ID ${validatedIssue.sprintId} not found` });
        }

        // Find the issue in the poker session
        const pokerIssue = project.activePokerSession.issues.find(
          (issue) => issue._id.toString() === validatedIssue.issueId
        );

        if (!pokerIssue) {
          return res.status(404).json({ message: `Issue with ID ${validatedIssue.issueId} not found in poker session` });
        }

        // Create a task in the sprint based on the poker issue
        const task = {
          _id: pokerIssue._id, // Keep the same ID for reference
          title: pokerIssue.title,
          description: pokerIssue.description,
          status: "To Do",
          priority: pokerIssue.priority || "Medium",
          estimate: validatedIssue.finalEstimate,
          assignedTo: validatedIssue.assignedTo,
          deadline: validatedIssue.deadline,
        };

        // Add the task to the sprint
        sprint.tasks.push(task);
      }
    }

    // Remove validated issues from the poker session
    project.activePokerSession.issues = project.activePokerSession.issues.filter(
      (issue) => !validatedIssueIds.includes(issue._id.toString())
    );

    // Remove validated issues from the backlog
    project.backlog = project.backlog.filter(
      (task) => !validatedIssueIds.includes(task._id.toString())
    );

    // Save the changes
    await project.save();

    // Emit events for each deleted issue to notify clients
    for (const issueId of validatedIssueIds) {
      req.io.to(projectId).emit("issueDeleted", { issueId });
    }

    res.status(200).json({ message: "Issues validated, added to sprint, and removed from poker session and backlog successfully" });
  } catch (error) {
    console.error("Error in batch validation:", error);
    res.status(500).json({ message: "Error validating issues", error: error.message });
  }
};

/**
 * Validate a poker issue
 */
exports.validatePokerIssue = async (req, res) => {
  try {
    const { finalEstimate, sprintId, assignedTo, delay } = req.body;
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Only project owner can validate
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the project owner can validate issues" });
    }

    const issue = project.activePokerSession.issues.id(req.params.issueId);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    // If a sprint is specified, add the issue to that sprint
    if (sprintId) {
      const sprint = project.sprints.id(sprintId);
      if (!sprint) return res.status(404).json({ message: "Sprint not found" });

      // Create a task in the sprint based on the poker issue
      const task = {
        _id: issue._id, // Keep the same ID for reference
        title: issue.title,
        description: issue.description,
        status: "To Do",
        priority: issue.priority || "Medium",
        estimate: finalEstimate,
        assignedTo,
        deadline: delay ? new Date(Date.now() + delay * 24 * 60 * 60 * 1000) : undefined,
      };

      // Add the task to the sprint
      sprint.tasks.push(task);
    }

    // Remove the issue from the poker session
    project.activePokerSession.issues.pull(req.params.issueId);

    // Also remove from backlog if it exists there
    const backlogTaskIndex = project.backlog.findIndex((task) => task._id.toString() === req.params.issueId);
    if (backlogTaskIndex !== -1) {
      project.backlog.splice(backlogTaskIndex, 1);
    }

    await project.save();

    // Emit issue deleted event
    req.io.to(req.params.projectId).emit("issueDeleted", { issueId: req.params.issueId });

    res.status(200).json({ message: "Issue validated, added to sprint, and removed from poker session and backlog successfully" });
  } catch (error) {
    console.error("Error validating session:", error);
    res.status(500).json({ message: "Error validating session", error: error.message });
  }
};

/**
 * Reveal votes for a poker issue
 */
exports.revealPokerIssue = async (req, res) => {
  const projectId = req.params.projectId;
  const issueId = req.params.issueId;

  console.log(`[DEBUG] Revealing votes - Project: ${projectId}, Issue: ${issueId}`);

  try {
    console.log(`[DEBUG] Finding project ${projectId} and populating votes`);
    const project = await Project.findById(projectId).populate(
      "activePokerSession.issues.votes.user",
      "username",
    );
    if (!project) {
      console.log(`[DEBUG] Project ${projectId} not found`);
      return res.status(404).json({ message: "Project not found" });
    }

    console.log(`[DEBUG] Finding issue ${issueId} in the poker session`);
    const issue = project.activePokerSession.issues.id(issueId);
    if (!issue) {
      console.log(`[DEBUG] Issue ${issueId} not found in the poker session`);
      return res.status(404).json({ message: "Issue not found" });
    }

    console.log(`[DEBUG] Current issue status: ${issue.status}, Votes count: ${issue.votes.length}`);
    issue.status = "Revealed";
    console.log(`[DEBUG] Updated issue status to: ${issue.status}`);

    console.log(`[DEBUG] Saving project with updated status`);
    await project.save();

    // Get the populated votes to send to clients
    console.log(`[DEBUG] Fetching populated issue to send to clients`);
    const populatedIssue = await Project.findById(projectId)
      .populate("activePokerSession.issues.votes.user", "username")
      .then((p) => p.activePokerSession.issues.id(issueId));

    if (!populatedIssue) {
      console.log(`[DEBUG] Failed to retrieve populated issue after saving`);
      return res.status(500).json({ message: "Error retrieving updated issue" });
    }

    console.log(`[DEBUG] Populated issue retrieved successfully. Votes count: ${populatedIssue.votes.length}`);

    // Emit voteRevealed event for real-time updates
    console.log(`[DEBUG] Emitting voteRevealed event to room ${projectId} with data:`, {
      issueId,
      votesCount: populatedIssue.votes.length,
      status: "Revealed",
    });

    req.io.to(projectId).emit("voteRevealed", {
      issueId,
      votes: populatedIssue.votes,
      status: "Revealed",
    });

    // Check if the socket.io adapter is working
    console.log(`[DEBUG] Socket.IO adapter type: ${req.io.adapter.constructor.name}`);
    console.log(`[DEBUG] Socket.IO rooms for project ${projectId}:`, req.io.sockets.adapter.rooms.get(projectId));
    console.log(`[DEBUG] Number of clients in room ${projectId}:`, req.io.sockets.adapter.rooms.get(projectId)?.size || 0);

    res.status(200).json({ message: "Votes revealed", issue: populatedIssue });
  } catch (error) {
    console.error("Error revealing votes:", error);
    res.status(500).json({ message: "Error revealing votes", error: error.message });
  }
};

/**
 * Add a task to backlog and create a poker issue
 */
exports.addBacklogTask = async (req, res) => {
  try {
    const { title, description, priority, assignedTo, deadline } = req.body;
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!project.members.map((m) => m._id.toString()).includes(req.user.id))
      return res.status(403).json({ message: "Unauthorized" });

    // Create a new task with a shared ID
    const taskId = new mongoose.Types.ObjectId();
    const newTask = {
      _id: taskId,
      title,
      description,
      priority,
      status: "To Do",
      assignedTo,
      deadline,
    };

    // Add to backlog
    project.backlog.push(newTask);

    // Ensure activePokerSession exists
    if (!project.activePokerSession) {
      project.activePokerSession = { issues: [] };
    }

    // Add the same task as a poker issue with the same ID
    const newPokerIssue = {
      ...newTask,
      status: "Not Started",
      votes: [],
    };
    project.activePokerSession.issues.push(newPokerIssue);

    await project.save();

    // Emit issueAdded event for real-time updates
    req.io.to(req.params.projectId).emit("issueAdded", { issue: newPokerIssue });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: "Error adding task to backlog", error: error.message });
  }
};

/**
 * Create a new sprint
 */
exports.createSprint = async (req, res) => {
  try {
    const { name, startDate, endDate, goals } = req.body;
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!project.members.map((m) => m._id.toString()).includes(req.user.id.toString()))
      return res.status(403).json({ message: "Unauthorized" });
    project.sprints = project.sprints || [];
    const newSprint = { name, tasks: [], active: true, startDate, endDate, goals };
    project.sprints.push(newSprint);
    await project.save();
    res.status(201).json({ message: "Sprint created", sprint: newSprint });
  } catch (error) {
    res.status(500).json({ message: "Error creating sprint", error: error.message });
  }
};

/**
 * Add a task to a sprint
 */
exports.addTaskToSprint = async (req, res) => {
  try {
    const { taskId, assignedTo, deadline } = req.body;
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!project.members.map((m) => m._id.toString()).includes(req.user.id.toString()))
      return res.status(403).json({ message: "Unauthorized" });

    const sprint = project.sprints.id(req.params.sprintId);
    if (!sprint) return res.status(404).json({ message: "Sprint not found" });

    // Find the task in the backlog
    const backlogTask = project.backlog.id(taskId);
    if (!backlogTask) return res.status(404).json({ message: "Task not found in backlog" });

    // Create a copy of the task for the sprint
    const sprintTask = {
      _id: backlogTask._id, // Keep the same ID for reference
      title: backlogTask.title,
      description: backlogTask.description,
      status: "To Do",
      priority: backlogTask.priority,
      assignedTo: assignedTo || backlogTask.assignedTo,
      deadline: deadline || backlogTask.deadline,
    };

    // Add to sprint
    sprint.tasks.push(sprintTask);

    // Remove from backlog
    project.backlog.pull(taskId);

    await project.save();
    res.status(200).json({ message: "Task added to sprint", task: sprintTask });
  } catch (error) {
    console.error("Error adding task to sprint:", error);
    res.status(500).json({ message: "Error adding task to sprint", error: error.message });
  }
};

/**
 * Update task status
 */
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!project.members.map((m) => m._id.toString()).includes(req.user.id.toString()))
      return res.status(403).json({ message: "Unauthorized" });

    const sprint = project.sprints.id(req.params.sprintId);
    if (!sprint) return res.status(404).json({ message: "Sprint not found" });

    const task = sprint.tasks.id(req.params.taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.status = status;
    await project.save();
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: "Error updating task status", error: error.message });
  }
};

/**
 * Delete a task from backlog
 */
exports.deleteBacklogTask = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!project.members.map((m) => m._id.toString()).includes(req.user.id.toString()))
      return res.status(403).json({ message: "Unauthorized" });

    project.backlog = project.backlog.filter((task) => task._id.toString() !== req.params.taskId);

    // Also remove from poker session if it exists
    if (project.activePokerSession && project.activePokerSession.issues) {
      const issueIndex = project.activePokerSession.issues.findIndex(
        (issue) => issue._id.toString() === req.params.taskId,
      );

      if (issueIndex !== -1) {
        project.activePokerSession.issues.splice(issueIndex, 1);
        // Emit issue deleted event
        req.io.to(req.params.projectId).emit("issueDeleted", { issueId: req.params.taskId });
      }
    }

    await project.save();
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: "Error deleting task", error: error.message });
  }
};

/**
 * Delete a sprint
 */
exports.deleteSprint = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!project.members.map((m) => m._id.toString()).includes(req.user.id.toString()))
      return res.status(403).json({ message: "Unauthorized" });

    project.sprints = project.sprints.filter((sprint) => sprint._id.toString() !== req.params.sprintId);
    await project.save();
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: "Error deleting sprint", error: error.message });
  }
};

/**
 * Delete a task from a sprint
 */
exports.deleteSprintTask = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!project.members.map((m) => m._id.toString()).includes(req.user.id.toString()))
      return res.status(403).json({ message: "Unauthorized" });

    const sprint = project.sprints.id(req.params.sprintId);
    if (!sprint) return res.status(404).json({ message: "Sprint not found" });

    sprint.tasks = sprint.tasks.filter((task) => task._id.toString() !== req.params.taskId);
    await project.save();
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: "Error deleting task", error: error.message });
  }
};

/**
 * Delete a poker issue
 */
exports.deletePokerIssue = async (req, res) => {
  const { projectId, issueId } = req.params;
  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    if (!project.members.map((m) => m._id.toString()).includes(req.user.id)) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const issueIndex = project.activePokerSession?.issues?.findIndex((issue) => issue._id.toString() === issueId);
    if (issueIndex === -1 || issueIndex === undefined) {
      return res.status(404).json({ message: "Issue not found" });
    }
    project.activePokerSession.issues.splice(issueIndex, 1);
    await project.save();
    console.log(`Emitting issueDeleted event to room ${projectId} for issue ${issueId}`);
    req.io.to(projectId).emit("issueDeleted", { issueId });
    res.status(200).json({ message: "Issue deleted successfully" });
  } catch (error) {
    console.error("Error deleting issue:", error);
    res.status(500).json({ message: "Error deleting issue", error: error.message });
  }
};