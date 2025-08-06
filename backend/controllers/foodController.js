import foodModel from "../models/foodModel.js";
import fs from 'fs';

// add food item
const addFood = async (req, res) => {
  console.log("REQ.FILE:", req.file); // Debug file upload
  console.log("REQ.BODY:", req.body); // Debug data input

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Gambar tidak ditemukan! Pastikan Anda mengunggah file."
      });
    }

    let image_filename = req.file.filename;

    const food = new foodModel({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      image: image_filename
    });

    await food.save();
    res.json({ success: true, message: "Food added successfully" });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// all food list
const listFood = async (req,res) => {
  try {
    const foods = await foodModel.find({});
    res.json({succes:true,data:foods})
  } catch (error) {
    console.log(error);
    res.json({success:false,message:"Error"})
  }
}

// remove food item
const removeFood = async (req,res) => {
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
    res.json({succes:true,message:"Food removed"})
  } catch (error) {
    console.log(error);
    res.json({succes:false,message:"error"})
  }
}

// edit food item
const editFood = async (req, res) => {
  try {
    const { id, name, description, price, category } = req.body;

    const food = await foodModel.findById(id);
    if (!food) {
      return res.status(404).json({ success: false, message: "Food not found" });
    }

    food.name = name;
    food.description = description;
    food.price = price;
    food.category = category;

    if (req.file) {
      // Jika ada gambar baru diunggah
      if (food.image) {
        // Hapus gambar lama jika ada
        fs.unlink(`uploads/${food.image}`, (err) => {
          if (err) {
            console.error("Gagal menghapus gambar lama:", err);
          }
        });
      }
      food.image = req.file.filename;
    }

    await food.save();
    res.json({ success: true, message: "Food updated successfully" });
  } catch (error) {
    console.error("Edit Error:", error);
    res.status(500).json({ success: false, message: "Server error saat update" });
  }
};

export { addFood, listFood, removeFood, editFood };