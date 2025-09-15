import mongoose from "mongoose";

const voucherSchema = new mongoose.Schema({
  discountType: { type: String, enum: ["percent", "amount"], required: true },
  discountValue: { type: Number, required: true },
  minPurchase: { type: Number, default: 0 },
  maxUsagePerUser: { type: Number, default: 1 }, // ✅
  maxUsagePerDay: { type: Number, default: 0 }, // ✅
  autoApply: { type: Boolean, default: false },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
}, { timestamps: true });


export default mongoose.model("Voucher", voucherSchema);