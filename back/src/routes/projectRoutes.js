const express = require("express");
const Project = require("../models/Project");
const User = require("../models/User");
const { authenticateJWT } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Private
 */
router.post("/", authenticateJWT, async (req, res) => {
  try {
    const { name, description } = req.body;
    const newProject = new Project({ name, description, owner: req.user.id, members: [req.user.id] });
    await newProject.save();
    res.status(201).json(newProject);
  } catch (error) {
    res.status(500).json({ message: "Error creating project", error: error.message });
  }
});

/**
 * @route   GET /api/projects
 * @desc    Get all projects for the logged-in user
 * @access  Private
 */
router.get("/", authenticateJWT, async (req, res) => {
  try {
    const projects = await Project.find({ members: req.user.id }).populate("members", "username email");
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: "Error fetching projects", error: error.message });
  }
});

/**
 * @route   GET /api/projects/:projectId
 * @desc    Get a specific project
 * @access  Private
 */
router.get("/:projectId", authenticateJWT, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId).populate("members", "username email").populate("owner", "username");
    if (!project) return res.status(404).json({ message: "Project not found" });
    console.log("User ID:", req.user.id, "Project Members:", project.members.map(m => m._id.toString()));
    if (!project.members.map(m => m._id.toString()).includes(req.user.id)) return res.status(403).json({ message: "Unauthorized" });
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: "Error fetching project", error: error.message });
  }
});

/**
 * @route   POST /api/projects/:projectId/members
 * @desc    Invite a user to a project
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
router.post("/:projectId/backlog", authenticateJWT, async (req, res) => {
  try {
    const { title, description, priority } = req.body;
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!project.members.includes(req.user.id)) return res.status(403).json({ message: "Unauthorized" });
    project.backlog.push({ title, description, priority, status: "To Do" });
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: "Error adding task to backlog", error: error.message });
  }
});

router.post("/:projectId/sprints", authenticateJWT, async (req, res) => {
  try {
    const { name, startDate, endDate, goals } = req.body;
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!project.members.map(m => m._id.toString()).includes(req.user.id.toString())) return res.status(403).json({ message: "Unauthorized" });
    project.sprints = project.sprints || [];
    const newSprint = { name, tasks: [], active: true, startDate, endDate, goals };
    project.sprints.push(newSprint);
    await project.save();
    res.status(201).json({ message: "Sprint created", sprint: newSprint });
  } catch (error) {
    res.status(500).json({ message: "Error creating sprint", error: error.message });
  }
});

router.post("/:projectId/sprints/:sprintId/tasks", authenticateJWT, async (req, res) => {
  try {
    const { taskId, assignedTo, deadline } = req.body;
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!project.members.map(m => m._id.toString()).includes(req.user.id.toString())) return res.status(403).json({ message: "Unauthorized" });
    
    const sprint = project.sprints.id(req.params.sprintId);
    if (!sprint) return res.status(404).json({ message: "Sprint not found" });
    
    const task = project.backlog.id(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });
    
    sprint.tasks.push({ ...task.toObject(), assignedTo, deadline });
    project.backlog = project.backlog.filter(t => t._id.toString() !== taskId);
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: "Error adding task to sprint", error: error.message });
  }
});

router.put("/:projectId/sprints/:sprintId/tasks/:taskId", authenticateJWT, async (req, res) => {
  try {
    const { status } = req.body;
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!project.members.map(m => m._id.toString()).includes(req.user.id.toString())) return res.status(403).json({ message: "Unauthorized" });
    
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
});

router.post("/:projectId/sprints/:sprintId/review", authenticateJWT, async (req, res) => {
  try {
    const { note } = req.body;
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!project.members.map(m => m._id.toString()).includes(req.user.id.toString())) return res.status(403).json({ message: "Unauthorized" });
    
    const sprint = project.sprints.id(req.params.sprintId);
    if (!sprint) return res.status(404).json({ message: "Sprint not found" });
    
    sprint.reviewNotes = sprint.reviewNotes || [];
    sprint.reviewNotes.push(note);
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: "Error adding review note", error: error.message });
  }
});

router.post("/:projectId/sprints/:sprintId/retrospective", authenticateJWT, async (req, res) => {
  try {
    const { note } = req.body;
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!project.members.map(m => m._id.toString()).includes(req.user.id.toString())) return res.status(403).json({ message: "Unauthorized" });
    
    const sprint = project.sprints.id(req.params.sprintId);
    if (!sprint) return res.status(404).json({ message: "Sprint not found" });
    
    sprint.retrospectiveNotes = sprint.retrospectiveNotes || [];
    sprint.retrospectiveNotes.push(note);
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: "Error adding retrospective note", error: error.message });
  }
});
router.delete("/:projectId/backlog/:taskId", authenticateJWT, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!project.members.map(m => m._id.toString()).includes(req.user.id.toString())) return res.status(403).json({ message: "Unauthorized" });

    project.backlog = project.backlog.filter(task => task._id.toString() !== req.params.taskId);
    await project.save();
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: "Error deleting task", error: error.message });
  }
});

router.delete("/:projectId/sprints/:sprintId", authenticateJWT, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!project.members.map(m => m._id.toString()).includes(req.user.id.toString())) return res.status(403).json({ message: "Unauthorized" });

    project.sprints = project.sprints.filter(sprint => sprint._id.toString() !== req.params.sprintId);
    await project.save();
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: "Error deleting sprint", error: error.message });
  }
});

router.delete("/:projectId/sprints/:sprintId/tasks/:taskId", authenticateJWT, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!project.members.map(m => m._id.toString()).includes(req.user.id.toString())) return res.status(403).json({ message: "Unauthorized" });

    const sprint = project.sprints.id(req.params.sprintId);
    if (!sprint) return res.status(404).json({ message: "Sprint not found" });

    sprint.tasks = sprint.tasks.filter(task => task._id.toString() !== req.params.taskId);
    await project.save();
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: "Error deleting task", error: error.message });
  }
});

router.delete("/:projectId/sprints/:sprintId/review/:noteIndex", authenticateJWT, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!project.members.map(m => m._id.toString()).includes(req.user.id.toString())) return res.status(403).json({ message: "Unauthorized" });

    const sprint = project.sprints.id(req.params.sprintId);
    if (!sprint) return res.status(404).json({ message: "Sprint not found" });

    sprint.reviewNotes = sprint.reviewNotes.filter((_, index) => index !== parseInt(req.params.noteIndex));
    await project.save();
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: "Error deleting review note", error: error.message });
  }
});

router.delete("/:projectId/sprints/:sprintId/retrospective/:noteIndex", authenticateJWT, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!project.members.map(m => m._id.toString()).includes(req.user.id.toString())) return res.status(403).json({ message: "Unauthorized" });

    const sprint = project.sprints.id(req.params.sprintId);
    if (!sprint) return res.status(404).json({ message: "Sprint not found" });

    sprint.retrospectiveNotes = sprint.retrospectiveNotes.filter((_, index) => index !== parseInt(req.params.noteIndex));
    await project.save();
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: "Error deleting retrospective note", error: error.message });
  }
});
router.delete("/:projectId", authenticateJWT, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if the user is the owner or a member
    if (!project.members.map(m => m._id.toString()).includes(req.user.id.toString())) {
      return res.status(403).json({ message: "Unauthorized to delete this project" });
    }

    // Optionally, you might want to restrict deletion to the owner only
    if (project.owner._id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Only the project owner can delete this project" });
    }

    await Project.deleteOne({ _id: req.params.projectId });
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting project", error: error.message });
  }
});
router.post("/:projectId/sprints/:sprintId/dailyScrum", authenticateJWT, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    const sprint = project.sprints.id(req.params.sprintId);
    if (!sprint) return res.status(404).json({ message: "Sprint not found" });
    sprint.dailyScrumNotes.push(req.body.note);
    await project.save();
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: "Error adding daily scrum note", error: error.message });
  }
});
module.exports = router;