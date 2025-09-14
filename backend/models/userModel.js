import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    cartData: { type: Object, default: {} },
  },
  { 
    minimize: false, 
    timestamps: true // ✅ tambahin biar bisa simpan createdAt & updatedAt
  }
);

// ✅ konsisten: gunakan "User" sebagai nama model biar sama dengan ref di Review.js
const userModel = mongoose.models.User || mongoose.model("User", userSchema);

export default userModel;
