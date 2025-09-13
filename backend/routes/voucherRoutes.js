import express from "express";
import Voucher from "../models/voucherModel.js";

const router = express.Router();

// Tambah voucher
router.post("/", async (req, res) => {
  try {
    const voucher = new Voucher(req.body);
    await voucher.save();
    res.status(201).json(voucher);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Ambil semua voucher
router.get("/", async (req, res) => {
  try {
    const vouchers = await Voucher.find();
    res.json(vouchers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update voucher
router.put("/:id", async (req, res) => {
  try {
    const voucher = await Voucher.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(voucher);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Hapus voucher
router.delete("/:id", async (req, res) => {
  try {
    await Voucher.findByIdAndDelete(req.params.id);
    res.json({ message: "Voucher dihapus" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.post("/", async (req, res) => {
  try {
    console.log("Voucher diterima backend:", req.body); // 👉 cek isi request
    const voucher = new Voucher(req.body);
    await voucher.save();
    res.status(201).json(voucher);
  } catch (err) {
    console.error("Error tambah voucher:", err);
    res.status(400).json({ message: err.message });
  }
});

export default router;
