// controllers/adminController.js

import Admin from "../models/adminModel.js";
import bcrypt from "bcryptjs";

// Controller untuk register admin
export const registerAdmin = async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    // Cek apakah admin sudah ada
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ message: "Admin sudah terdaftar" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Simpan admin ke database
    const newAdmin = new Admin({
      name,
      phone,
      email,
      password: hashedPassword,
    });

    await newAdmin.save();

    res.status(201).json({ message: "Admin berhasil didaftarkan" });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server", error: error.message });
  }
};
