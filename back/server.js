const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const projectRoutes = require("./routes/projectRoutes");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://focusflow-frontend.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Redis Adapter Setup
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()])
  .then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log("Redis adapter connected for Socket.IO");
  })
  .catch((err) => {
    console.error("Failed to connect to Redis:", err);
    console.warn("Falling back to in-memory adapter for Socket.IO");
  });

// Middleware
app.use(cors({
  origin: "https://focusflow-frontend.vercel.app",
  credentials: true,
}));
app.use(express.json());

// Pass io to projectRoutes
app.use("/api/projects", projectRoutes(io));

// Socket.IO Connection
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("joinRoom", (projectId) => {
    socket.join(projectId);
    console.log(`User ${socket.id} joined room ${projectId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});