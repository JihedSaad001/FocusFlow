const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server and integrate with Socket.IO
const server = http.createServer(app);

// Configure allowed origins for CORS
const allowedOrigins = [
  "http://localhost:5173", // For local development
  "https://focus-flow-dusky.vercel.app", // Deployed frontend URL
];

// Configure Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST"],
    credentials: true, // Allow credentials
  },
});

// Configure Express CORS middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true, // Allow credentials
  })
);

app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("MongoDB Error:", err));

// Import the Project model
const Project = require("./src/models/Project");

// WebSocket connection handling
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Join a room based on projectId (for PlanningSession.tsx)
  socket.on("joinRoom", (projectId) => {
    socket.join(projectId);
    console.log(`User ${socket.id} joined room ${projectId}`);
  });

  // Handle voting in planning session
  socket.on("vote", async ({ projectId, issueId, vote, userId, username, totalVotes }) => {
    try {
      const project = await Project.findById(projectId);
      if (!project || !project.activePokerSession) {
        socket.emit("error", "No active poker session found");
        return;
      }

      const issue = project.activePokerSession.issues.find(
        (i) => i._id.toString() === issueId
      );
      if (!issue) {
        socket.emit("error", "Issue not found");
        return;
      }

      // Update or add the user's vote
      const existingVote = issue.votes.find((v) => v.user.toString() === userId);
      if (existingVote) {
        existingVote.vote = vote;
      } else {
        issue.votes.push({ user: userId, vote });
      }

      await project.save();

      // Broadcast the updated votes to all users in the room
      io.to(projectId).emit("voteUpdate", {
        issueId,
        vote,
        userId,
        username,
        totalVotes: issue.votes.length,
      });
    } catch (error) {
      console.error("Error handling vote:", error);
      socket.emit("error", "Failed to record vote");
    }
  });

  // Handle revealing votes
  socket.on("revealVotes", async ({ projectId, issueId }) => {
    try {
      const project = await Project.findById(projectId);
      if (!project || !project.activePokerSession) {
        socket.emit("error", "No active poker session found");
        return;
      }

      const issue = project.activePokerSession.issues.find(
        (i) => i._id.toString() === issueId
      );
      if (!issue) {
        socket.emit("error", "Issue not found");
        return;
      }

      issue.status = "Revealed";
      await project.save();

      // Broadcast the reveal event to all users in the room
      io.to(projectId).emit("votesRevealed", {
        issueId,
        votes: issue.votes,
        status: issue.status,
      });
    } catch (error) {
      console.error("Error revealing votes:", error);
      socket.emit("error", "Failed to reveal votes");
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Routes
const authRoutes = require("./src/routes/authRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const resourceRoutes = require("./src/routes/resourceRoutes");
const userDataRoutes = require("./src/routes/userDataRoutes");
const projectRoutes = require("./src/routes/projectRoutes");

// Pass io instance to projectRoutes for WebSocket broadcasting
app.use("/api/projects", projectRoutes(io));
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/user", userDataRoutes);

// Start the server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));