const express = require("express");
const { authenticateJWT } = require("../middleware/authMiddleware");
const userDataController = require("../controllers/userDataController");

module.exports = (User) => {
  const router = express.Router();
  const Project = require("../models/Project");

  console.log("✅ User model in userDataRoutes:", Object.keys(User.schema.paths));

  // Kanban board routes
  router.put("/kanban", authenticateJWT, (req, res) => userDataController.updateKanbanBoard(req, res, User));
  router.get("/kanban", authenticateJWT, (req, res) => userDataController.getKanbanBoard(req, res, User));

  //User data route
  router.get("/data", authenticateJWT, (req, res) => userDataController.getUserData(req, res, User));

  // Project task to kanban route
  router.post("/kanban/project-task", authenticateJWT, (req, res) =>
    userDataController.addProjectTaskToKanban(req, res, User, Project)
  );

  // Todo tasks routes
  router.get("/todo-tasks", authenticateJWT, (req, res) => userDataController.getTodoTasks(req, res, User));
  router.put("/todo-tasks", authenticateJWT, (req, res) => userDataController.updateTodoTasks(req, res, User));

  // Productivity tracking routes
  router.get("/stats", authenticateJWT, (req, res) => userDataController.getUserStats(req, res, User));
  router.post("/log-focus-session", authenticateJWT, (req, res) => userDataController.logFocusSession(req, res, User));
  router.post("/log-completed-task", authenticateJWT, (req, res) => userDataController.logCompletedTask(req, res, User));
  // AI insights endpoint removed

  return router;
};
