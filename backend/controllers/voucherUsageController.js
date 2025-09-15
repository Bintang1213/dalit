import Voucher from "../models/voucherModel.js";
import VoucherUsage from "../models/voucherUsageModel.js";

// Ambil semua voucher + info usage hari ini
export const getVoucherUsage = async (req, res) => {
  try {
    const vouchers = await Voucher.find();
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const result = await Promise.all(
      vouchers.map(async (v) => {
        // total penggunaan voucher hari ini
        const usagesToday = await VoucherUsage.countDocuments({
          voucherId: v._id,
          usedAt: { $gte: startOfDay, $lte: endOfDay },
        });

        const sisaHariIni =
          v.maxUsagePerDay > 0
            ? Math.max(v.maxUsagePerDay - usagesToday, 0)
            : "Unlimited";

        return {
          ...v.toObject(),
          sisaHariIni,
        };
      })
    );

    res.json(result);
  } catch (err) {
    console.error("Error getVoucherUsage:", err);
    res.status(500).json({ message: err.message });
  }
};

// User apply voucher
export const applyVoucher = async (req, res) => {
  try {
    const { voucherId, userId } = req.body;

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
      return res.status(404).json({ message: "Voucher tidak ditemukan" });
    }

    // hitung total pemakaian voucher hari ini (semua user)
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

    // cek kalau user ini sudah pakai voucher hari ini
    const userUsageToday = await VoucherUsage.countDocuments({
      voucherId,
      userId,
      usedAt: { $gte: startOfDay, $lte: endOfDay },
    });

    if (voucher.maxUsagePerUser > 0 && userUsageToday >= voucher.maxUsagePerUser) {
      return res
        .status(400)
        .json({ message: "Kamu sudah menggunakan voucher ini hari ini" });
    }

    // simpan pemakaian voucher
    await VoucherUsage.create({
      voucherId,
      userId,
      usedAt: new Date(),
    });

    res.json({ message: "Voucher berhasil digunakan" });
  } catch (err) {
    console.error("Error applyVoucher:", err);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};
