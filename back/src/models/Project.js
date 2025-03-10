const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  backlog: [
    {
      title: String,
      description: String,
      status: { type: String, enum: ["To Do", "In Progress", "Done"], default: "To Do" },
      priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
      assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      deadline: { type: Date },
      projectStage: { type: String, enum: ["Start", "In Progress", "Done"], default: "Start" },
    },
  ],
  sprints: [
    {
      name: String,
      tasks: [
        {
          title: String,
          description: String,
          status: { type: String, enum: ["To Do", "In Progress", "Done"], default: "To Do" },
          priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
          assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          deadline: { type: Date },
        },
      ],
      active: { type: Boolean, default: false },
      startDate: { type: Date },
      endDate: { type: Date },
      goals: [String],
      reviewNotes: [String],
      retrospectiveNotes: [String],
    },
  ],
});

module.exports = mongoose.model("Project", ProjectSchema);