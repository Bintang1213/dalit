import express from "express";
import mongoose from "mongoose";
import moment from "moment-timezone";
import Voucher from "../models/voucherModel.js";
import VoucherUsage from "../models/voucherUsageModel.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

/**
 * ============================
 * ✅ ADMIN: BUAT VOUCHER
 * ============================
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, remaining } = req.body;

    const voucher = new Voucher({
      ...req.body,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      remaining: typeof remaining === "number" ? remaining : -1,
    });

    await voucher.save();
    res.status(201).json(voucher);
  } catch (err) {
    console.error("Create voucher error:", err);
    res.status(400).json({ message: err.message });
  }
});

/**
 * ============================
 * ✅ ADMIN: GET SEMUA VOUCHER + SISA HARI INI
 * ============================
 */
router.get("/admin", authMiddleware, async (req, res) => {
  try {
    const vouchers = await Voucher.find().sort({ createdAt: -1 });

    const now = moment().tz("Asia/Jakarta").toDate();
    const startOfDay = moment(now).tz("Asia/Jakarta").startOf("day").toDate();
    const endOfDay = moment(now).tz("Asia/Jakarta").endOf("day").toDate();

    const result = await Promise.all(
      vouchers.map(async (v) => {
        const countToday = await VoucherUsage.countDocuments({
          voucherId: v._id,
          usedAt: { $gte: startOfDay, $lte: endOfDay },
        });

        const sisaHariIni =
          v.maxUsagePerDay && v.maxUsagePerDay > 0
            ? Math.max(v.maxUsagePerDay - countToday, 0)
            : "Unlimited";

        return {
          ...v.toObject(),
          sisaHariIni,
        };
      })
    );

    res.json(result);
  } catch (err) {
    console.error("Get admin vouchers error:", err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * ============================
 * ✅ PUBLIC: GET SEMUA VOUCHER
 * ============================
 */
router.get("/", async (req, res) => {
  try {
    const vouchers = await Voucher.find().sort({ createdAt: -1 });
    res.json(vouchers);
  } catch (err) {
    console.error("Get vouchers public error:", err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * ============================
 * ✅ USER: VOUCHER TERSEDIA
 * ============================
 */
router.get("/available", authMiddleware, async (req, res) => {
  try {
    const today = moment().tz("Asia/Jakarta").format("YYYY-MM-DD");

    const startOfToday = moment(today).tz("Asia/Jakarta").startOf("day").toDate();
    const endOfToday = moment(today).tz("Asia/Jakarta").endOf("day").toDate();

    const vouchers = await Voucher.find({
      startDate: { $lte: endOfToday },
      endDate: { $gte: startOfToday },
    }).sort({ discountValue: -1 });

    const usedVouchers = await VoucherUsage.find({
      userId: req.userId,
      tanggal: today,
    }).select("voucherId");

    const usedVoucherIds = usedVouchers.map((u) => u.voucherId.toString());

    const result = await Promise.all(
      vouchers.map(async (v) => {
        const usagesToday = await VoucherUsage.countDocuments({
          voucherId: v._id,
          usedAt: { $gte: startOfToday, $lte: endOfToday },
        });

        const globalSisaHariIni =
          v.maxUsagePerDay && v.maxUsagePerDay > 0
            ? Math.max(v.maxUsagePerDay - usagesToday, 0)
            : "Unlimited";

        const remainingGlobal = v.remaining >= 0 ? v.remaining : "Unlimited";
        const sudahDipakaiHariIni = usedVoucherIds.includes(v._id.toString());

        let sisaHariIniForUser;
        if (sudahDipakaiHariIni || v.remaining === 0 || globalSisaHariIni === 0) {
          sisaHariIniForUser = 0;
        } else {
          sisaHariIniForUser = 1;
        }

        return {
          ...v.toObject(),
          sisaHariIni: sisaHariIniForUser,
          globalSisaHariIni,
          remainingGlobal,
          sudahDipakaiHariIni,
        };
      })
    );

    res.status(200).json(result);
  } catch (err) {
    console.error("Get available vouchers error:", err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * ============================
 * ✅ USER: APPLY VOUCHER
 * ============================
 */
router.post("/apply", authMiddleware, async (req, res) => {
  try {
    const { voucherId, subtotal } = req.body;
    const userId = req.userId;

    const voucher = await Voucher.findById(voucherId);
    if (!voucher) return res.status(404).json({ message: "Voucher tidak ditemukan" });

    const todayStr = moment().tz("Asia/Jakarta").format("YYYY-MM-DD");
    const startOfDay = moment(todayStr).tz("Asia/Jakarta").startOf("day").toDate();
    const endOfDay = moment(todayStr).tz("Asia/Jakarta").endOf("day").toDate();
    const now = moment().tz("Asia/Jakarta").toDate();

    if (voucher.startDate > now) return res.status(400).json({ message: "Voucher belum aktif" });
    if (voucher.endDate < now) return res.status(400).json({ message: "Voucher sudah kadaluarsa" });

    if (subtotal < voucher.minPurchase) {
      return res.status(400).json({ message: "Belanja belum memenuhi minimum" });
    }

    const totalUsageToday = await VoucherUsage.countDocuments({
      voucherId,
      usedAt: { $gte: startOfDay, $lte: endOfDay },
    });

    if (voucher.maxUsagePerDay > 0 && totalUsageToday >= voucher.maxUsagePerDay) {
      return res.status(400).json({ message: "Kuota voucher hari ini habis" });
    }

    const userUsageToday = await VoucherUsage.countDocuments({
      voucherId,
      userId,
      usedAt: { $gte: startOfDay, $lte: endOfDay },
    });

    if (voucher.maxUsagePerUser > 0 && userUsageToday >= voucher.maxUsagePerUser) {
      return res.status(400).json({ message: "Kamu sudah pakai voucher hari ini" });
    }

    if (voucher.remaining >= 0 && voucher.remaining <= 0) {
      return res.status(400).json({ message: "Voucher sudah habis" });
    }

    let discount = 0;
    if (voucher.discountType === "percent") {
      discount = Math.floor((voucher.discountValue / 100) * subtotal);
    } else {
      discount = voucher.discountValue;
    }

    const usage = await VoucherUsage.create({
      voucherId,
      userId,
      usedAt: new Date(),
      tanggal: todayStr,
    });

    if (voucher.remaining >= 0) {
      voucher.remaining = Math.max(voucher.remaining - 1, 0);
      await voucher.save();
    }

    res.status(200).json({ message: "Voucher berhasil digunakan", discount, usage });
  } catch (err) {
    console.error("Apply voucher error:", err);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

/**
 * ============================
 * ✅ ADMIN: EDIT VOUCHER (INI YANG KITA TAMBAH)
 * ============================
 */
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const voucher = await Voucher.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      },
      { new: true }
    );

    res.json({
      message: "Voucher berhasil diupdate",
      voucher,
    });
  } catch (err) {
    console.error("Update voucher error:", err);
    res.status(400).json({ message: err.message });
  }
});

/**
 * ============================
 * ✅ ADMIN: DELETE VOUCHER
 * ============================
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await Voucher.findByIdAndDelete(req.params.id);
    res.json({ message: "Voucher dihapus" });
  } catch (err) {
    console.error("Delete voucher error:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
