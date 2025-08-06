import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";

// Membuat token
const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET);
};

// Login user
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "Pengguna tidak ada" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.json({ success: false, message: "Email atau Password Salah" });
        }

        const token = createToken(user._id);
        res.json({
            success: true,
            message: "Login berhasil",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Terjadi kesalahan saat login" });
    }
};

// Registrasi user
const registerUser = async (req, res) => {
    const { name, password, email } = req.body;
    try {
        const exists = await userModel.findOne({ email });
        if (exists) {
            return res.json({ success: false, message: "Pengguna sudah ada" });
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Gunakan email yang valid" });
        }

        if (password.length < 8) {
            return res.json({ success: false, message: "Gunakan kata sandi yang kuat" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new userModel({
            name,
            email,
            password: hashedPassword
        });

        const user = await newUser.save();
        const token = createToken(user._id);
        res.json({
            success: true,
            message: "Registrasi berhasil",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Terjadi kesalahan saat registrasi" });
    }
};

// Ambil semua pengguna
const getAllUsers = async (req, res) => {
    try {
        const users = await userModel.find({}, '-password');
        res.json({ success: true, data: users });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Gagal mengambil data pengguna" });
    }
};

// Hapus pengguna berdasarkan ID
const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await userModel.findByIdAndDelete(id);
        if (!user) {
            return res.json({ success: false, message: "Pengguna tidak ditemukan" });
        }
        res.json({ success: true, message: "Pengguna berhasil dihapus" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Gagal menghapus pengguna" });
    }
};

// Ambil data user dari token (profile)
const getUserProfile = async (req, res) => {
    try {
        const userId = req.userId; // dari authMiddleware
        const user = await userModel.findById(userId, '-password');
        if (!user) {
            return res.status(404).json({ success: false, message: "User tidak ditemukan" });
        }
        res.json({ success: true, data: user });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Gagal mengambil data user" });
    }
};

export {
    loginUser,
    registerUser,
    getAllUsers,
    deleteUser,
    getUserProfile
};
