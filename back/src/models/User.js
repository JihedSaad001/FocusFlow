const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true }, // Keeping username as per your intent
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePic: { 
    type: String, 
    default: "https://qhedchvmvmuflflstcwx.supabase.co/storage/v1/object/public/profile-pictures//image_2025-02-08_215223222.png" 
  },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  kanbanBoard: {
    type: {
      columns: [{
        id: String,
        title: String,
        tasks: [{
          id: String,
          title: String,
          priority: { type: String, enum: ["Low", "Medium", "High"] },
          date: String,
          icon: String,
        }],
      }],
    },
    default: { columns: [] },
  },
}, { strict: true }); // Enforce schema

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

console.log("✅ User schema defined:", Object.keys(UserSchema.paths));
module.exports = UserSchema;