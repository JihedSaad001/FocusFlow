const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

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
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationTokenExpires: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  wallpaper: { type: String, default: "" },
pomodoroSettings :{
   focusDuration: { type: Number, default: 25 },
   shortBreakDuration: { type: Number, default: 5 },
   longBreakDuration: { type: Number, default: 15 },
  },
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
        { id: "in progress-1", title: "In progress", tasks: [] },
        { id: "Blocked-1", title: "Blocked", tasks: [] },
        { id: "done-1", title: "Done", tasks: [] },
      ],
    },
  },
  todoTasks: [
    {
      _id: { type: String, required: true },
      title: { type: String, required: true },
      completed: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    }
  ],

  focusSessions: [
    {
      duration: { type: Number }, // in minutes
      completed: { type: Boolean, default: false },
      ambientSound: { type: String },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  tasksCompleted: { type: Number, default: 0 },


  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  focusTime: [
    {
      date: { type: Date },
      duration: { type: Number }, // in minutes
    },
  ],
  dailyTasks: [
    {
      date: { type: Date },
      count: { type: Number, default: 0 },
    },
  ],
  lastActive: { type: Date, default: Date.now },
  streakDays: { type: Number, default: 0 },
  lastStreakUpdate: { type: Date },
})

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

module.exports = mongoose.model("User", UserSchema)

