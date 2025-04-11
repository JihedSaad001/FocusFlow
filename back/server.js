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

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()])
  .then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log("Redis adapter connected for Socket.IO");
  })
  .catch((err) => {
    console.error("Failed to connect to Redis:", err);
  });

app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("MongoDB Error:", err));

const authRoutes = require("./src/routes/authRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const resourceRoutes = require("./src/routes/resourceRoutes");
const projectRoutes = require("./src/routes/projectRoutes");
const userDataRoutes = require("./src/routes/userDataRoutes"); // Updated

app.use("/api/projects", projectRoutes(io));
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/user", userDataRoutes); // Updated

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

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));