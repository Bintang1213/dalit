// backend/routes/foodRoutes.js
import express from "express";
import {
  addFood,
  listFood,
  removeFood,
  editFood,
  updateStatus,
  updateRecommendationStatus,
  getFoodDetailsById,
  searchFood,
} from "../controllers/foodController.js";
import Food from "../models/foodModel.js";
import multer from "multer";
import fs from "fs";

const foodRouter = express.Router();

// Buat folder uploads jika belum ada
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

// Middleware untuk menangani error multer
const uploadMiddleware = (req, res, next) => {
  upload.single("image")(req, res, function (err) {
    if (err) {
      console.error("Multer Error:", err);
      return res.status(400).json({
        success: false,
        message: "File upload error: " + err.message,
      });
    }
    next();
  });
};

// ======================
// Routes CRUD makanan
// ======================
foodRouter.post("/add", uploadMiddleware, addFood);
foodRouter.get("/", listFood);
foodRouter.get("/list", listFood);
foodRouter.post("/remove", removeFood);
foodRouter.post("/edit", uploadMiddleware, editFood);
foodRouter.post("/update-status", updateStatus);
foodRouter.post("/update-recommendation", updateRecommendationStatus); // Rute baru untuk rekomendasi
foodRouter.get("/search", searchFood);

// ======================
// Routes rekomendasi menu
// ======================
foodRouter.get("/recommendations", async (req, res) => {
  try {
    const recommendedMenus = await Food.find({ isRecommended: true });
    res.status(200).json({
      success: true,
      data: recommendedMenus,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ======================
// Rute untuk debugging
// ======================
foodRouter.get("/:id/details", getFoodDetailsById);

export default foodRouter;
