import Voucher from "../models/voucherModel.js";

// Admin: buat voucher
export const createVoucher = async (req, res) => {
  try {
    const voucher = new Voucher(req.body);
    await voucher.save();
    res.status(201).json({ success: true, voucher });
  } catch (err) {
    console.error("Error createVoucher:", err);
    res.status(500).json({ success: false, message: err.message });
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
    const voucher = await Voucher.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
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
