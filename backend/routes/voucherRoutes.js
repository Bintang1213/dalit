import express from "express";
import mongoose from "mongoose";
import Voucher from "../models/voucherModel.js";
import VoucherUsage from "../models/voucherUsageModel.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// ✅ Tambah voucher
router.post("/", async (req, res) => {
  try {
    const voucher = new Voucher(req.body);
    await voucher.save();
    res.status(201).json(voucher);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ✅ Ambil semua voucher + info pemakaian hari ini
router.get("/", async (req, res) => {
  try {
    const vouchers = await Voucher.find();

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await Promise.all(
      vouchers.map(async (v) => {
        const countToday = await VoucherUsage.countDocuments({
          voucherId: v._id,
          usedAt: { $gte: startOfDay, $lte: endOfDay },
        });

        let sisaHariIni;
        if (v.maxUsagePerDay === 0) {
          sisaHariIni = "Unlimited";
        } else {
          sisaHariIni = Math.max(v.maxUsagePerDay - countToday, 0);
        }

        return {
          ...v.toObject(),
          sisaHariIni,
        };
      })
    );

    res.json(result);
  } catch (err) {
    console.error("Error get vouchers:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Update voucher
router.put("/:id", async (req, res) => {
  try {
    const voucher = await Voucher.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(voucher);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ✅ Hapus voucher
router.delete("/:id", async (req, res) => {
  try {
    await Voucher.findByIdAndDelete(req.params.id);
    res.json({ message: "Voucher dihapus" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Apply voucher (pake token)
router.post("/apply", authMiddleware, async (req, res) => {
  try {
    const { voucherId } = req.body;
    const userId = req.userId; // ✅ otomatis dari token

    if (!voucherId) {
      return res.status(400).json({ message: "VoucherId tidak ditemukan" });
    }

    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
      return res.status(404).json({ message: "Voucher tidak ditemukan" });
    }

    // Cek expired
    if (new Date(voucher.endDate) < new Date()) {
      return res.status(400).json({ message: "Voucher sudah kadaluarsa" });
    }

    // Range hari ini
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // Cek kuota harian
    const countToday = await VoucherUsage.countDocuments({
      voucherId,
      usedAt: { $gte: startOfDay, $lte: endOfDay },
    });
    if (voucher.maxUsagePerDay > 0 && countToday >= voucher.maxUsagePerDay) {
      return res.status(400).json({ message: "Kuota voucher hari ini habis" });
    }

    // Cek kuota per user
    const userUsage = await VoucherUsage.countDocuments({ voucherId, userId });
    if (voucher.maxUsagePerUser > 0 && userUsage >= voucher.maxUsagePerUser) {
      return res.status(400).json({
        message: "Batas penggunaan voucher untuk user ini sudah habis",
      });
    }

    // ✅ Simpan penggunaan voucher
    const usage = await VoucherUsage.create({
      voucherId: new mongoose.Types.ObjectId(voucherId),
      userId: new mongoose.Types.ObjectId(userId),
    });
    console.log("Usage saved:", usage);

    res.json({
      message: "Voucher berhasil digunakan",
      voucher: {
        id: voucher._id,
        code: voucher.code,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        minPurchase: voucher.minPurchase,
      },
    });
  } catch (err) {
    console.error("Error apply voucher:", err.message);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

export default router;
