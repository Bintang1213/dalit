// backend/controllers/foodController.js
import foodModel from "../models/foodModel.js";
import fs from 'fs';

// Fungsi untuk menambahkan menu baru
const addFood = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Gambar tidak ditemukan!" });
    }

    const image_filename = req.file.filename;

    const food = new foodModel({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      status: req.body.status || "Tersedia",
      image: image_filename,
      isRecommended: req.body.isRecommended || false // Default isRecommended ke false
    });

    await food.save();
    res.json({ success: true, message: "Menu berhasil ditambahkan" });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Fungsi untuk mendapatkan semua menu
const listFood = async (req, res) => {
  try {
    const foods = await foodModel.find({});
    res.json({ success: true, data: foods });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Fungsi untuk menghapus menu
const removeFood = async (req, res) => {
  try {
    const food = await foodModel.findById(req.body.id);
    if (food && food.image) {
      fs.unlink(`uploads/${food.image}`, (err) => {
        if (err) {
          console.error("Gagal menghapus gambar:", err);
        }
      });
    }

    await foodModel.findByIdAndDelete(req.body.id);
    res.json({ success: true, message: "Menu berhasil dihapus" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "error" });
  }
};

// Fungsi untuk mengedit menu
const editFood = async (req, res) => {
  try {
    const { id, name, description, price, category, status, isRecommended } = req.body; // ✅ Tambahkan isRecommended

    const food = await foodModel.findById(id);
    if (!food) {
      return res.status(404).json({ success: false, message: "Menu tidak ditemukan" });
    }

    food.name = name;
    food.description = description;
    food.price = price;
    food.category = category;
    food.status = status || food.status;
    food.isRecommended = isRecommended !== undefined ? isRecommended : food.isRecommended; // ✅ Update isRecommended

    if (req.file) {
      if (food.image) {
        fs.unlink(`uploads/${food.image}`, (err) => {
          if (err) {
            console.error("Gagal menghapus gambar lama:", err);
          }
        });
      }
      food.image = req.file.filename;
    }

    await food.save();
    res.json({ success: true, message: "Menu berhasil diperbarui" });
  } catch (error) {
    console.error("Edit Error:", error);
    res.status(500).json({ success: false, message: "Server error saat update" });
  }
};

// Fungsi untuk memperbarui status menu (Tersedia/Habis)
const updateStatus = async (req, res) => {
    try {
        const { id, status } = req.body;
        const food = await foodModel.findById(id);

        if (!food) {
            return res.status(404).json({ success: false, message: "Menu tidak ditemukan" });
        }
        
        food.status = status;
        await food.save();
        res.json({ success: true, message: "Status berhasil diperbarui" });

    } catch (error) {
        console.error("Error saat memperbarui status:", error);
        res.status(500).json({ success: false, message: "Server error saat update status" });
    }
};

// Fungsi untuk memperbarui status rekomendasi
const updateRecommendationStatus = async (req, res) => {
    try {
        const { id, isRecommended } = req.body;
        const food = await foodModel.findById(id);

        if (!food) {
            return res.status(404).json({ success: false, message: "Menu tidak ditemukan" });
        }

        food.isRecommended = isRecommended;
        await food.save();
        res.json({ success: true, message: "Status rekomendasi berhasil diperbarui" });
    } catch (error) {
        console.error("Error saat memperbarui status rekomendasi:", error);
        res.status(500).json({ success: false, message: "Server error saat update rekomendasi" });
    }
}

// Fungsi untuk mendapatkan detail menu tunggal (untuk debugging)
const getFoodDetailsById = async (req, res) => {
    try {
        const food = await foodModel.findById(req.params.id);
        if (!food) {
            return res.status(404).json({ success: false, message: "Menu tidak ditemukan" });
        }
        res.json({ success: true, data: food });
    } catch (error) {
        console.error("Error fetching food details:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export { addFood, listFood, removeFood, editFood, updateStatus, updateRecommendationStatus, getFoodDetailsById };