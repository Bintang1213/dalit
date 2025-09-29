import mongoose from "mongoose";

const voucherSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" }, // opsional: nama voucher
    discountType: { type: String, enum: ["percent", "amount"], required: true },
    discountValue: { type: Number, required: true },
    minPurchase: { type: Number, default: 0 },
    maxUsagePerUser: { type: Number, default: 1 }, // per user total (or per day depending usage logic)
    maxUsagePerDay: { type: Number, default: 0 }, // 0 = unlimited (global per day)
    autoApply: { type: Boolean, default: false },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    remaining: { type: Number, default: -1 }, // -1 = unlimited global stock, otherwise decremented on apply
    // tambahan meta jika perlu
  },
  { timestamps: true },
);

export default mongoose.model("Voucher", voucherSchema);
