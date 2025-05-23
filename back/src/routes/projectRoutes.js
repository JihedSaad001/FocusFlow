const express = require("express");
const { authenticateJWT } = require("../middleware/authMiddleware");
const projectController = require("../controllers/projectController");

const router = express.Router();

module.exports = (io) => {
  router.use((req, res, next) => {
    req.io = io;
    next();
  });

  // Route to create a new project
  router.post("/", authenticateJWT, projectController.createProject);

  // Route to get all projects for a user
  router.get("/", authenticateJWT, projectController.getUserProjects);

  // Route to get a specific project by ID
  router.get("/:projectId", authenticateJWT, projectController.getProjectById);



  // Route to delete a project
  router.delete("/:projectId", authenticateJWT, projectController.deleteProject);

  // Route to add a member to a project
  router.post("/:projectId/members", authenticateJWT, projectController.addProjectMember);

  // Route to remove a member from a project
  router.delete("/:projectId/members/:memberId", authenticateJWT, projectController.removeProjectMember);

  // Route to start a poker session
  router.post("/:projectId/poker/start", authenticateJWT, projectController.startPokerSession);

  // Route to get the poker session
  router.get("/:projectId/poker", authenticateJWT, projectController.getPokerSession);

  // Route to add an issue to the poker session
  router.post("/:projectId/poker/issue", authenticateJWT, projectController.addPokerIssue);

  // Route to record a vote for an issue
  router.post("/:projectId/poker/issue/:issueId/vote", authenticateJWT, projectController.voteOnPokerIssue);

  // Fetch chat messages
  router.get("/:projectId/chat", authenticateJWT, projectController.getChatMessages);

  // Socket.IO event for sending messages
  io.on("connection", (socket) => {
    socket.on("joinRoom", (projectId) => {
      socket.join(projectId);
      console.log(`Socket ${socket.id} joined room ${projectId}`);

      // Notify the client that they've successfully joined the room
      socket.emit("roomJoined", { projectId });
    });

    socket.on("sendMessage", async ({ projectId, userId, message }) => {
      try {
        const Project = require("../models/Project");
        const User = require("../models/User");

        const project = await Project.findById(projectId);
        if (!project) return;

        const user = await User.findById(userId).select("username profilePic");
        const newMessage = { user: userId, message, timestamp: new Date() };

        project.chatMessages.push(newMessage);
        await project.save();

        io.to(projectId).emit("receiveMessage", {
          user: { _id: userId, username: user.username, profilePic: user.profilePic },
          message,
          timestamp: newMessage.timestamp,
        });
      } catch (error) {
        console.error("Error sending message:", error);
      }
    });
  });

  router.post("/:projectId/poker/issue/:issueId/revote", authenticateJWT, projectController.requestRevote);

  // Batch validate endpoint for poker issues
  router.post("/:projectId/poker/batch-validate", authenticateJWT, projectController.batchValidatePokerIssues);

  // Updated validate route to handle sprint assignment, member assignment, and deadline
  router.post("/:projectId/poker/issue/:issueId/validate", authenticateJWT, projectController.validatePokerIssue);

  router.post("/:projectId/poker/issue/:issueId/reveal", authenticateJWT, projectController.revealPokerIssue);

  // Modified route to add a task to backlog and automatically create a poker issue
  router.post("/:projectId/backlog", authenticateJWT, projectController.addBacklogTask);

  router.post("/:projectId/sprints", authenticateJWT, projectController.createSprint);

  router.post("/:projectId/sprints/:sprintId/tasks", authenticateJWT, projectController.addTaskToSprint);

  router.put("/:projectId/sprints/:sprintId/tasks/:taskId", authenticateJWT, projectController.updateTaskStatus);

  router.delete("/:projectId/backlog/:taskId", authenticateJWT, projectController.deleteBacklogTask);

  router.delete("/:projectId/sprints/:sprintId", authenticateJWT, projectController.deleteSprint);

  router.delete("/:projectId/sprints/:sprintId/tasks/:taskId", authenticateJWT, projectController.deleteSprintTask);

  router.delete("/:projectId/poker/issue/:issueId", authenticateJWT, projectController.deletePokerIssue);

  return router;
};