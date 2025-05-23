const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;


const allowedOrigins = [
  "https://focus-flow-dusky.vercel.app",
  "https://focusflow-admin.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
];

// CORS config
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || !allowedOrigins.includes(origin)) {
        return callback(new Error("Not allowed by CORS"));
      }
      return callback(null, true);
    },
    credentials: true, // Allow cookies
  })
);

// Create HTTP server and integrate with Socket
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Set up Redis adapter for Socket.IO to handle multiple instances
const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

// Connect to Redis clients and set up the adapter
Promise.all([pubClient.connect(), subClient.connect()])
  .then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log("Redis adapter connected");
  })
  .catch(() => {
    console.log("Using default in-memory adapter");
  });

app.use(express.json());


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("MongoDB Error:", err));

// Routes
const authRoutes = require("./src/routes/authRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const resourceRoutes = require("./src/routes/resourceRoutes");
const projectRoutes = require("./src/routes/projectRoutes");
const userDataRoutes = require("./src/routes/userDataRoutes");

app.use("/api/projects", projectRoutes(io));
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/user", userDataRoutes);

// WebSocket connection handling
io.on("connection", (socket) => {
  // Join a room based on projectId
  socket.on("joinRoom", (projectId) => {
    socket.join(projectId);

    // Emit a confirmation back to the client
    socket.emit("roomJoined", { projectId, success: true });
  });

  socket.on("disconnect", () => {
  });

  socket.on("error", (error) => {
    console.error(`Socket error:`, error);
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));