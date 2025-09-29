import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";

const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET);
};

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
                email: user.email,
            },
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Terjadi kesalahan saat login" });
    }
};

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
            return res.json({
                success: false,
                message: "Gunakan kata sandi yang kuat",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new userModel({
            name,
            email,
            password: hashedPassword,
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
                email: user.email,
            },
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Terjadi kesalahan saat registrasi" });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await userModel.find({}, "-password");
        res.json({ success: true, data: users });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Gagal mengambil data pengguna" });
    }
};

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

const getUserProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await userModel.findById(userId, "-password");
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "User tidak ditemukan" });
        }
        res.json({ success: true, data: user });
    } catch (error) {
        console.log(error);
        res
            .status(500)
            .json({ success: false, message: "Gagal mengambil data user" });
    }
};

const updateUserProfile = async (req, res) => {
    const { name, email, oldPassword, newPassword } = req.body;
    const userId = req.userId;

    try {
        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User tidak ditemukan" });
        }

        if (name && name.trim() !== "") {
            user.name = name.trim();
        }
        if (email && validator.isEmail(email) && email !== user.email) {
            const emailExists = await userModel.findOne({ email });
            if (emailExists) {
                return res.json({ success: false, message: "Email ini sudah terdaftar" });
            }
            user.email = email;
        }

        if (newPassword) {
            if (!oldPassword) {
                return res.json({ success: false, message: "Kata sandi lama diperlukan untuk mengganti sandi" });
            }
            if (newPassword.length < 8) {
                return res.json({ success: false, message: "Kata sandi baru harus minimal 8 karakter" });
            }

            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return res.json({ success: false, message: "Kata sandi lama salah" });
            }

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        const updatedUser = await user.save();

        res.json({
            success: true,
            message: "Profil berhasil diperbarui",
            data: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
            },
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Gagal memperbarui profil" });
    }
};

export { loginUser, registerUser, getAllUsers, deleteUser, getUserProfile, updateUserProfile };