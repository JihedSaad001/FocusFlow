const mongoose = require("mongoose");

const ResourceSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["wallpaper", "audio"], required: true }, // Type of resource
    name: { type: String, required: true }, // Name of file
    url: { type: String, required: true }, // File URL (stored in Supabase, Firebase, etc.)
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Who uploaded it
    isActive: { type: Boolean, default: true }, // Enables/disables the resource (admins only)

    // Wallpaper-specific fields
    category: { type: String, enum: ["nature", "abstract", "dark", "minimal"], default: "abstract" },
    tags: [{ type: String }], // Flexible tags for better categorization

    // Audio-specific fields
    duration: { type: Number, default: 0 }, // Audio duration in seconds
    format: { type: String, enum: ["mp3", "wav", "ogg"], default: "mp3" }, // Audio format
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resource", ResourceSchema);
