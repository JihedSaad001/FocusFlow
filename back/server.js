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
const PORT = process.env.PORT || 5000; // Changed to 5002 to avoid port conflict

// Define allowed origins for both Express and Socket.IO
const allowedOrigins = [
  "https://focus-flow-dusky.vercel.app", // Main frontend (update with your actual domain)
  "https://focusflow-admin.vercel.app", // Admin frontend (update with your actual domain)
  "http://localhost:5173",
  "http://localhost:5174", // Local development
];

// CORS configuration for Express
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Allow cookies and authorization headers
  })
);

// Create HTTP server and integrate with Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins, // Use the same allowed origins as Express
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
    console.log("Redis adapter connected for Socket.IO");
  })
  .catch((err) => {
    console.error("Failed to connect to Redis:", err);
    // Fallback to default in-memory adapter if Redis fails
  });

app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("MongoDB Error:", err));

// Routes
const authRoutes = require("./src/routes/authRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const resourceRoutes = require("./src/routes/resourceRoutes");
const projectRoutes = require("./src/routes/projectRoutes");
const User = require("./src/models/User"); // Ensure User model is imported

// Pass User to userDataRoutes
const userDataRoutes = require("./src/routes/userDataRoutes")(User);

app.use("/api/projects", projectRoutes(io));
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/user", userDataRoutes);

// WebSocket connection handling
io.on("connection", (socket) => {
  console.log("[SOCKET] A user connected:", socket.id);
  console.log("[SOCKET] Auth token:", socket.handshake.auth.token ? "Present" : "Missing");
  console.log("[SOCKET] Transport:", socket.conn.transport.name);

  // Log all rooms the socket is currently in
  console.log("[SOCKET] Current rooms:", Array.from(socket.rooms));

  // Debug middleware to log all events
  socket.onAny((event, ...args) => {
    console.log(`[SOCKET] Event received: ${event}`, args);
  });

  // Join a room based on projectId
  socket.on("joinRoom", (projectId) => {
    console.log(`[SOCKET] User ${socket.id} joining room ${projectId}`);
    socket.join(projectId);

    // Log all rooms after joining
    console.log(`[SOCKET] User ${socket.id} rooms after joining:`, Array.from(socket.rooms));

    // Log all clients in the room
    const clients = io.sockets.adapter.rooms.get(projectId);
    console.log(`[SOCKET] Clients in room ${projectId}:`, clients ? Array.from(clients) : "None");
    console.log(`[SOCKET] Number of clients in room ${projectId}:`, clients ? clients.size : 0);

    // Emit a confirmation back to the client
    socket.emit("roomJoined", { projectId, success: true });
  });

  socket.on("disconnect", (reason) => {
    console.log(`[SOCKET] User disconnected: ${socket.id}, Reason: ${reason}`);
  });

  socket.on("error", (error) => {
    console.error(`[SOCKET] Socket error for ${socket.id}:`, error);
  });

  // Log when a client pings the server
  socket.conn.on("packet", (packet) => {
    if (packet.type === "ping") {
      console.log(`[SOCKET] Ping received from ${socket.id}`);
    }
  });
});

// Start the server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
