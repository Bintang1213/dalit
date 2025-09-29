import express from "express";
import mongoose from "mongoose";
import moment from "moment-timezone";
import Voucher from "../models/voucherModel.js";
import VoucherUsage from "../models/voucherUsageModel.js";
import authMiddleware from "../middleware/auth.js"; // pastikan middleware meng-set req.userId

const router = express.Router();

/**
 * ADMIN: buat voucher
 * - Tidak ada cek "unik tanggal" sehingga bisa bikin banyak voucher di tanggal yg sama
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    // OPTIONAL: cek apakah user adalah admin (sesuaikan middleware/role)
    // if (!req.isAdmin) return res.status(403).json({ message: "Forbidden" });

    // parse tanggal agar tersimpan Date yang benar
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
 * ADMIN: ambil semua voucher (raw) + tambahan sisa hari ini (global)
 */
router.get("/admin", authMiddleware, async (req, res) => {
  try {
    // if (!req.isAdmin) return res.status(403).json({ message: "Forbidden" });
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
      }),
    );

    res.json(result);
  } catch (err) {
    console.error("Get admin vouchers error:", err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * PUBLIC: ambil semua voucher (untuk admin view tanpa auth) - optional
 * NOTE: kalau kamu ingin memaksa admin-only, hapus route ini.
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
 * USER: ambil voucher yang tersedia untuk user (auth)
 * - mengembalikan info apakah user sudah pakai voucher hari ini
 * - menampilkan sisaHariIni untuk user (0/1 atau nilai sesuai remaining)
 * - menjaga nama-nama class frontend (kamu minta jangan ganti) -> ini backend tidak ubah class
 */
router.get("/available", authMiddleware, async (req, res) => {
  try {
    const today = moment().tz("Asia/Jakarta").format("YYYY-MM-DD");

    // ambil voucher yang masih aktif hari ini (startDate <= today <= endDate)
    const startOfToday = moment(today)
      .tz("Asia/Jakarta")
      .startOf("day")
      .toDate();
    const endOfToday = moment(today).tz("Asia/Jakarta").endOf("day").toDate();

    // Ambil semua voucher yang masih berlaku hari ini
    const vouchers = await Voucher.find({
      startDate: { $lte: endOfToday },
      endDate: { $gte: startOfToday },
    }).sort({ discountValue: -1 });

    // ambil semua usage user hari ini (by tanggal string)
    const usedVouchers = await VoucherUsage.find({
      userId: req.userId,
      tanggal: today,
    }).select("voucherId");

    const usedVoucherIds = usedVouchers.map((u) => u.voucherId.toString());

    const result = await Promise.all(
      vouchers.map(async (v) => {
        // cek global sisa hari ini (berdasarkan maxUsagePerDay)
        const usagesToday = await VoucherUsage.countDocuments({
          voucherId: v._id,
          usedAt: { $gte: startOfToday, $lte: endOfToday },
        });

        const globalSisaHariIni =
          v.maxUsagePerDay && v.maxUsagePerDay > 0
            ? Math.max(v.maxUsagePerDay - usagesToday, 0)
            : "Unlimited";

        // sisa global stok berdasarkan 'remaining'
        const remainingGlobal = v.remaining >= 0 ? v.remaining : "Unlimited";

        const sudahDipakaiHariIni = usedVoucherIds.includes(v._id.toString());

        // untuk frontend: sisaHariIni untuk user = jika sudah dipakai => 0, else: min(1, remainingGlobal, globalSisaHariIni)
        let sisaHariIniForUser;
        if (sudahDipakaiHariIni) {
          sisaHariIniForUser = 0;
        } else if (v.remaining === 0) {
          sisaHariIniForUser = 0;
        } else if (v.maxUsagePerDay > 0 && globalSisaHariIni === 0) {
          sisaHariIniForUser = 0;
        } else {
          sisaHariIniForUser = 1; // user masih bisa pakai 1 kali (logika perUser perDay tetap dipertahankan)
        }

        return {
          ...v.toObject(),
          sisaHariIni: sisaHariIniForUser,
          globalSisaHariIni,
          remainingGlobal,
          sudahDipakaiHariIni,
        };
      }),
    );

    res.status(200).json(result);
  } catch (err) {
    console.error("Get available vouchers error:", err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * USER: apply voucher (auth)
 * - Memeriksa:
 *   * voucher aktif (tanggal)
 *   * global kuota per hari (maxUsagePerDay)
 *   * per-user per-day (cek VoucherUsage dengan tanggal)
 *   * remaining (stok global)
 * - Jika lulus, simpan VoucherUsage dengan tanggal (YYYY-MM-DD Asia/Jakarta) dan decrement remaining jika diperlukan
 */
router.post("/apply", authMiddleware, async (req, res) => {
  try {
    const { voucherId, subtotal } = req.body;
    const userId = req.userId;

    if (!voucherId) {
      return res.status(400).json({ message: "voucherId tidak ditemukan" });
    }

    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
      return res.status(404).json({ message: "Voucher tidak ditemukan" });
    }

    const todayStr = moment().tz("Asia/Jakarta").format("YYYY-MM-DD");
    const startOfDay = moment(todayStr)
      .tz("Asia/Jakarta")
      .startOf("day")
      .toDate();
    const endOfDay = moment(todayStr).tz("Asia/Jakarta").endOf("day").toDate();

    // cek tanggal aktif
    const nowJakarta = moment().tz("Asia/Jakarta").toDate();
    if (voucher.startDate && voucher.startDate > nowJakarta) {
      return res.status(400).json({ message: "Voucher belum aktif" });
    }
    if (voucher.endDate && voucher.endDate < nowJakarta) {
      return res.status(400).json({ message: "Voucher sudah kadaluarsa" });
    }

    // cek subtotal minimal
    if (typeof subtotal === "number" && subtotal < voucher.minPurchase) {
      return res
        .status(400)
        .json({ message: "Belanja belum memenuhi syarat minimum." });
    }

    // cek global kuota per hari
    const totalUsageToday = await VoucherUsage.countDocuments({
      voucherId,
      usedAt: { $gte: startOfDay, $lte: endOfDay },
    });

    if (
      voucher.maxUsagePerDay > 0 &&
      totalUsageToday >= voucher.maxUsagePerDay
    ) {
      return res.status(400).json({ message: "Kuota voucher hari ini habis" });
    }

    // cek per-user per-day (jika maksUsagePerUser dimaksudkan per hari)
    const userUsageToday = await VoucherUsage.countDocuments({
      voucherId,
      userId,
      usedAt: { $gte: startOfDay, $lte: endOfDay },
    });

    if (
      voucher.maxUsagePerUser > 0 &&
      userUsageToday >= voucher.maxUsagePerUser
    ) {
      return res
        .status(400)
        .json({ message: "Kamu sudah menggunakan voucher ini hari ini" });
    }

    // cek remaining global
    if (voucher.remaining >= 0 && voucher.remaining <= 0) {
      return res.status(400).json({ message: "Voucher sudah habis." });
    }

    // hitung diskon untuk preview
    let discount = 0;
    if (voucher.discountType === "percent") {
      discount = Math.floor((voucher.discountValue / 100) * (subtotal || 0));
    } else {
      discount = voucher.discountValue;
    }

    // simpan usage
    const usage = await VoucherUsage.create({
      voucherId: new mongoose.Types.ObjectId(voucherId),
      userId: new mongoose.Types.ObjectId(userId),
      usedAt: new Date(),
      tanggal: todayStr,
    });

    // decrement remaining jika ada stok yang terbatas
    if (voucher.remaining >= 0) {
      voucher.remaining = Math.max(voucher.remaining - 1, 0);
      await voucher.save();
    }

    return res.status(200).json({
      message: "Voucher berhasil digunakan",
      voucher: {
        id: voucher._id,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        minPurchase: voucher.minPurchase,
      },
      discount,
      usage,
    });
  } catch (err) {
    console.error("Apply voucher error:", err);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

/**
 * Update voucher (admin)
 */
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    // if (!req.isAdmin) return res.status(403).json({ message: "Forbidden" });
    const voucher = await Voucher.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        startDate: req.body.startDate
          ? new Date(req.body.startDate)
          : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      },
      { new: true },
    );
    res.json(voucher);
  } catch (err) {
    console.error("Update voucher error:", err);
    res.status(400).json({ message: err.message });
  }
});

/**
 * Delete voucher (admin)
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    // if (!req.isAdmin) return res.status(403).json({ message: "Forbidden" });
    await Voucher.findByIdAndDelete(req.params.id);
    res.json({ message: "Voucher dihapus" });
  } catch (err) {
    console.error("Delete voucher error:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
