const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePic: { 
    type: String, 
    default: "https://qhedchvmvmuflflstcwx.supabase.co/storage/v1/object/public/profile-pictures//image_2025-02-08_215223222.png" 
  },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  kanbanBoard: {
    type: {
      columns: [
        {
          id: { type: String, required: true },
          title: { type: String, required: true },
          tasks: [
            {
              id: { type: String, required: true },
              title: { type: String, required: true },
              priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
              date: { type: String },
              icon: { type: String },
            },
          ],
        },
      ],
    },
    default: {
      columns: [
        { id: "backlog-1", title: "Backlog", tasks: [] },
        { id: "todo-1", title: "To Do", tasks: [] },
        { id: "totest-1", title: "To Test", tasks: [] },
        { id: "doing-1", title: "Doing", tasks: [] },
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