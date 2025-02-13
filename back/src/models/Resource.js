const mongoose = require("mongoose");

const ResourceSchema = new mongoose.Schema({
  type: { type: String, enum: ["wallpaper", "audio"], required: true }, // Type of resource
  name: { type: String, required: true }, // Name of file
  url: { type: String, required: true }, // File URL (to be stored in Firebase, AWS, or local storage)
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" } // Who uploaded it
}, { timestamps: true });

module.exports = mongoose.model("Resource", ResourceSchema);
