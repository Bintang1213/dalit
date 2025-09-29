import express from "express";
import Voucher from "../models/voucherModel.js";
import VoucherUsage from "../models/voucherUsageModel.js";
import authMiddleware from "../middleware/auth.js";
import moment from "moment-timezone";

const router = express.Router();

// ✅ Ambil semua voucher yang tersedia untuk user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const today = moment().tz("Asia/Jakarta").format("YYYY-MM-DD");

    // Ambil semua voucher
    const vouchers = await Voucher.find();

    // Ambil semua voucher yang sudah dipakai user hari ini
    const usedVouchers = await VoucherUsage.find({
      userId: req.userId,
      tanggal: today,
    }).select("voucherId");

    const usedVoucherIds = usedVouchers.map((u) => u.voucherId.toString());

    // Buat list voucher dengan info tambahan
    const availableVouchers = vouchers.map((v) => {
      const sudahDipakai = usedVoucherIds.includes(v._id.toString());

      // kalau sudah dipakai = 0, kalau belum pakai = 1 (asal stok masih ada)
      const sisaHariIni = sudahDipakai ? 0 : v.remaining;

      return {
        _id: v._id,
        discountType: v.discountType,
        discountValue: v.discountValue,
        minPurchase: v.minPurchase,
        remaining: v.remaining, // stok global
        sisaHariIni, // stok untuk user hari ini
        sudahDipakai,
      };
    });

    res.status(200).json(availableVouchers);
  } catch (error) {
    console.error("Gagal ambil voucher:", error);
    res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server." });
  }
});

// ✅ Apply voucher
router.post("/apply", authMiddleware, async (req, res) => {
  try {
    const { voucherId, subtotal } = req.body;

    if (!voucherId || !subtotal) {
      return res
        .status(400)
        .json({ success: false, message: "Data tidak lengkap." });
    }

    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
      return res
        .status(404)
        .json({ success: false, message: "Voucher tidak ditemukan." });
    }

    // Cek sisa voucher
    if (voucher.remaining <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Voucher sudah habis." });
    }

    const today = moment().tz("Asia/Jakarta").format("YYYY-MM-DD");

    const alreadyUsed = await VoucherUsage.findOne({
      userId: req.userId,
      voucherId: voucher._id,
      tanggal: today,
    });

    if (alreadyUsed) {
      return res.status(400).json({
        success: false,
        message: "Voucher sudah digunakan hari ini.",
      });
    }

    if (subtotal < voucher.minPurchase) {
      return res.status(400).json({
        success: false,
        message: "Belanja belum memenuhi syarat minimum.",
      });
    }

    let discount = 0;
    if (voucher.discountType === "percent") {
      discount = Math.floor((voucher.discountValue / 100) * subtotal);
    } else {
      discount = voucher.discountValue;
    }

    voucher.remaining -= 1;
    await voucher.save();

    await VoucherUsage.create({
      userId: req.userId,
      voucherId: voucher._id,
      tanggal: today,
    });

    return res.status(200).json({
      success: true,
      discount,
      voucher,
      message: "Voucher berhasil diterapkan.",
    });
  } catch (error) {
    console.error("Gagal apply voucher:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat apply voucher.",
    });
  }
});

export default router;
