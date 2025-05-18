const mongoose = require("mongoose");

const ResourceSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["wallpaper", "audio", "music"], required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isActive: { type: Boolean, default: true },
    category: { type: String, enum: ["nature", "abstract", "dark", "minimal"], default: "abstract" },
    tags: [{ type: String }],
    format: { type: String, enum: ["mp3", "wav", "ogg", "jpg", "jpeg", "png", "gif", "webp"], default: "mp3" },
  }
);

module.exports = mongoose.model("Resource", ResourceSchema);