import Voucher from "../models/Voucher.js";

// Admin: buat voucher baru
export const createVoucher = async (req, res) => {
  try {
    const voucher = new Voucher(req.body);
    await voucher.save();
    res.status(201).json(voucher);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Admin: lihat semua voucher
export const getVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find();
    res.json(vouchers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: edit voucher
export const updateVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(voucher);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Admin: hapus voucher
export const deleteVoucher = async (req, res) => {
  try {
    await Voucher.findByIdAndDelete(req.params.id);
    res.json({ message: "Voucher deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// User: pakai kode voucher manual
export const applyVoucher = async (req, res) => {
  try {
    const { code, userId, total } = req.body;
    const voucher = await Voucher.findOne({ code });

    if (!voucher) return res.status(404).json({ error: "Voucher tidak ditemukan" });

    const now = new Date();
    if (now < voucher.startDate || now > voucher.endDate) {
      return res.status(400).json({ error: "Voucher sudah expired" });
    }

    if (total < voucher.minPurchase) {
      return res.status(400).json({ error: `Minimal belanja Rp ${voucher.minPurchase}` });
    }

    // cek batas per user
    const userCount = voucher.usedBy.filter(u => u === userId).length;
    if (userCount >= voucher.maxUsagePerUser) {
      return res.status(400).json({ error: "Anda sudah mencapai batas pemakaian voucher" });
    }

    // cek batas per hari
    const today = now.toISOString().slice(0, 10); // "YYYY-MM-DD"
    const dailyCount = voucher.dailyUsageCount.get(today) || 0;
    if (voucher.maxDailyUsage > 0 && dailyCount >= voucher.maxDailyUsage) {
      return res.status(400).json({ error: "Voucher hari ini sudah habis" });
    }

    // hitung diskon
    let discount = 0;
    if (voucher.discountType === "percent") discount = (total * voucher.discountValue) / 100;
    if (voucher.discountType === "amount") discount = voucher.discountValue;

    // update data voucher
    voucher.usedBy.push(userId);
    voucher.dailyUsageCount.set(today, dailyCount + 1);
    await voucher.save();

    res.json({ success: true, discount, code: voucher.code });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
