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
const io = new Server(server, {
  cors: {
    origin: "focus-flow-dusky.vercel.app", // Allow frontend origin (adjust for production)
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.log("MongoDB Error:", err));

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

// WebSocket connection handling
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Join a room based on projectId
  socket.on("joinRoom", (projectId) => {
    socket.join(projectId);
    console.log(`User ${socket.id} joined room ${projectId}`);
  });

  socket.on("vote", ({ projectId, issueId, vote, userId }) => {
    // Broadcast the vote update to all users in the room
    io.to(projectId).emit("voteUpdate", { issueId, vote, userId });
  });

  socket.on("revealVotes", ({ projectId, issueId }) => {
    // Broadcast the reveal event to all users in the room
    io.to(projectId).emit("votesRevealed", { issueId });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start the server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));