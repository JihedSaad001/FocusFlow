const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePic: { type: String, default: "https://qhedchvmvmuflflstcwx.supabase.co/storage/v1/object/public/profile-pictures//image_2025-02-08_215223222.png" },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  wallpaper: { type: String, default: "" }, // Stores the selected wallpaper URL
  pomodoroSettings: {
    mode: { type: String, default: "focus" }, // Current Pomodoro mode
    time: { type: Number, default: 1500 }, // Current time in seconds
    customMinutes: { type: Number, default: 25 }, // Custom minutes for Pomodoro
  },
  tasks: [{
    id: { type: Number, required: true }, // Task ID
    text: { type: String, required: true }, // Task description
    completed: { type: Boolean, default: false }, // Task completion status
  }],
});

// Hash password before saving the user
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("User", UserSchema);