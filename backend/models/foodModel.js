// backend/models/foodModel.js
import mongoose from "mongoose";

const foodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true }, // ✅ Number untuk harga
    image: { type: String, required: true },
    category: { type: String, required: true },
    status: {
      type: String,
      enum: ["Tersedia", "Habis"],
      default: "Tersedia",
    },
    isRecommended: {
      type: Boolean,
      default: false, // ✅ menu default tidak direkomendasikan
    },
  },
  { timestamps: true } // ✅ otomatis ada createdAt & updatedAt
);

// ✅ nama model konsisten: "Food"
const Food = mongoose.models.Food || mongoose.model("Food", foodSchema);

export default Food;
