const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const PORT = 5000; // Hardcoded since no .env

// Create HTTP server and integrate with Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://focus-flow-dusky.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect("mongodb://your-mongodb-uri") // Replace with your MongoDB URI
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

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start the server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));