import mongoose from "mongoose";

const voucherUsageSchema = new mongoose.Schema({
  voucherId: { type: mongoose.Schema.Types.ObjectId, ref: "Voucher", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  usedAt: { type: Date, default: Date.now },
  tanggal: { type: String }, // format YYYY-MM-DD (Asia/Jakarta) untuk quick query per-hari
});

export default mongoose.model("VoucherUsage", voucherUsageSchema);
