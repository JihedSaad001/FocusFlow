// src/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePic: {
    type: String,
    default:
      "https://qhedchvmvmuflflstcwx.supabase.co/storage/v1/object/public/profile-pictures//image_2025-02-08_215223222.png",
  },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  isVerified: { type: Boolean, default: false }, // Email verification status
  verificationToken: { type: String }, // Token for email verification
  verificationTokenExpires: { type: Date }, // Expiry for verification token
  resetPasswordToken: { type: String }, // Token for password reset
  resetPasswordExpires: { type: Date }, // Expiry for password reset token
  kanbanBoard: {
    type: {
      columns: [
        {
          id: { type: String, required: true },
          title: { type: String, required: true },
          tasks: [
            {
              _id: { type: String, required: true },
              title: { type: String, required: true },
              priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
              deadline: { type: String },
              icon: { type: String },
              description: { type: String },
              projectId: { type: String }, // Reference to the project
              sprintId: { type: String }, // Reference to the sprint
              originalTaskId: { type: String }, // Reference to the original task in the project
            },
          ],
        },
      ],
    },
    default: {
      columns: [
        { id: "backlog-1", title: "Backlog", tasks: [] },
        { id: "todo-1", title: "To Do", tasks: [] },
        { id: "doing-1", title: "Doing", tasks: [] },
        { id: "totest-1", title: "To Test", tasks: [] },
        { id: "done-1", title: "Done", tasks: [] },
      ],
    },
  },
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