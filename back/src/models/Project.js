const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, default: mongoose.Types.ObjectId },
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ["To Do", "In Progress","Testing","Blocked", "Done"], default: "To Do" },
  priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  deadline: { type: Date },
  projectStage: { type: String, enum: ["Start", "In Progress", "Done"], default: "Start" },
  finalEstimate: { type: String }, // Store the final estimate from poker session
});

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  backlog: [TaskSchema], // Use the shared TaskSchema
  sprints: [
    {
      name: String,
      tasks: [TaskSchema], // Use the shared TaskSchema for sprint tasks
      active: { type: Boolean, default: false },
      startDate: { type: Date },
      endDate: { type: Date },
      goals: [String],
      reviewNotes: [String],
      retrospectiveNotes: [String],
    },
  ],
  chatMessages: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      message: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  activePokerSession: {
    issues: [
      {
        ...TaskSchema.obj, // Use the same structure as TaskSchema
        status: {
          type: String,
          enum: ["Not Started", "Voting", "Revealed", "Finished"],
          default: "Not Started",
        },
        votes: [
          {
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            vote: String,
          },
        ],
      },
    ],
  },
});

module.exports = mongoose.model("Project", ProjectSchema);