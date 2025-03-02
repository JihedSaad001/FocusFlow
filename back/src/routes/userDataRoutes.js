const express = require("express");

module.exports = (User) => {
  const router = express.Router();
  const { authenticateJWT } = require("../middleware/authMiddleware");

  console.log("✅ User model in userDataRoutes:", Object.keys(User.schema.paths));

  router.put("/kanban", authenticateJWT, async (req, res) => {
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
        { new: true, runValidators: true }
      );

      console.log("User after update:", user);
      if (!user) return res.status(404).json({ message: "User not found" });

      res.status(200).json({ message: "Kanban board saved successfully", kanbanBoard: user.kanbanBoard });
    } catch (error) {
      console.error("Error in PUT /kanban:", error);
      res.status(500).json({ message: "Error saving Kanban board", error: error.message });
    }
  });

  router.get("/kanban", authenticateJWT, async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.status(200).json({ kanbanBoard: user.kanbanBoard });
    } catch (error) {
      console.error("Error in GET /kanban:", error);
      res.status(500).json({ message: "Error fetching Kanban board", error: error.message });
    }
  });

  router.get("/data", authenticateJWT, async (req, res) => {
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
  });

  return router;
};