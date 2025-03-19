const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const allowedOrigins = [
  "https://focus-flow-dusky.vercel.app",
  
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("MongoDB Error:", err));

const Project = require("./src/models/Project");

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("joinRoom", (projectId) => {
    socket.join(projectId);
    console.log(`User ${socket.id} joined room ${projectId}`);
  });

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

      const existingVote = issue.votes.find((v) => v.user.toString() === userId);
      if (existingVote) {
        existingVote.vote = vote;
      } else {
        issue.votes.push({ user: userId, vote });
      }

      await project.save();

      io.to(projectId).emit("voteUpdate", {
        issueId,
        vote,
        userId,
        username,
        totalVotes: issue.votes.length,
      });
      console.log("Emitted voteUpdate:", { issueId, vote, userId, username, totalVotes: issue.votes.length });
    } catch (error) {
      console.error("Error handling vote:", error);
      socket.emit("error", "Failed to record vote");
    }
  });

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

      io.to(projectId).emit("votesRevealed", {
        issueId,
        votes: issue.votes,
        status: issue.status,
      });
      console.log("Emitted votesRevealed:", { issueId, votes: issue.votes, status: issue.status });
    } catch (error) {
      console.error("Error revealing votes:", error);
      socket.emit("error", "Failed to reveal votes");
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const authRoutes = require("./src/routes/authRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const resourceRoutes = require("./src/routes/resourceRoutes");
const userDataRoutes = require("./src/routes/userDataRoutes");
const projectRoutes = require("./src/routes/projectRoutes");

app.use("/api/projects", projectRoutes(io));
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/user", userDataRoutes);

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));