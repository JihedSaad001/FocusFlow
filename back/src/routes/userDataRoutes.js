const express = require("express");
const { authenticateJWT } = require("../middleware/authMiddleware");
const userDataController = require("../controllers/userDataController");
const User = require("../models/User");


const router = express.Router();

console.log("✅ User model in userDataRoutes:", Object.keys(User.schema.paths));

// Kanban board routes
router.put("/kanban", authenticateJWT, userDataController.updateKanbanBoard);
router.get("/kanban", authenticateJWT, userDataController.getKanbanBoard);

//User data route
router.get("/data", authenticateJWT, userDataController.getUserData);



// Todo tasks routes
router.get("/todo-tasks", authenticateJWT, userDataController.getTodoTasks);
router.put("/todo-tasks", authenticateJWT, userDataController.updateTodoTasks);

// Productivity tracking routes
router.get("/stats", authenticateJWT, userDataController.getUserStats);
router.post("/log-focus-session", authenticateJWT, userDataController.logFocusSession);
router.post("/log-completed-task", authenticateJWT, userDataController.logCompletedTask);

// Wallpaper routes
router.put("/wallpaper", authenticateJWT, userDataController.updateWallpaper);
router.get("/wallpaper", authenticateJWT, userDataController.getWallpaper);

module.exports = router;
