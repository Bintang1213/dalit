// routes/reviewRoute.js
import express from "express";
import {
  addReview,
  getReviews,
  toggleMenuRecommendation,
  getTopRatedMenus,
  getReviewByOrder,
  deleteReview, // <-- Import fungsi baru
} from "../controllers/reviewController.js";

const router = express.Router();

// User tambah review
router.post("/", addReview);

// User lihat review berdasarkan order
router.get("/order/:orderId", getReviewByOrder);

// Admin ambil semua review
router.get("/", getReviews);

// Admin toggle rekomendasi menu
router.put("/menu/:foodId/recommendation", toggleMenuRecommendation);

// Ambil menu top rated
router.get("/top", getTopRatedMenus);

// 🆕 Rute untuk menghapus ulasan
router.delete("/:id", deleteReview);

export default router;