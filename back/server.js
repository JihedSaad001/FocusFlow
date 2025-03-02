const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.send("✅ API is running!");
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB:", mongoose.connection.name);

    // Register User model
    const UserSchema = require("./src/models/User");
    const User = mongoose.model("User", UserSchema);
    console.log("✅ User model registered:", Object.keys(User.schema.paths));

    // Pass User to routes
    const authRoutes = require("./src/routes/authRoutes")
    const adminRoutes = require("./src/routes/adminRoutes")
    const resourceRoutes = require("./src/routes/resourceRoutes")
    const userDataRoutes = require("./src/routes/userDataRoutes")

    app.use("/api/auth", authRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/resources", resourceRoutes);
    app.use("/api/user", userDataRoutes);

    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => console.log("❌ MongoDB Error:", err));