import express from "express";
import {
  addReview,
  getReviews,
  toggleMenuRecommendation,
  getTopRatedMenus,
} from "../controllers/reviewController.js";

const router = express.Router();

// ✅ Tambah ulasan (user)
router.post("/", addReview);

// ✅ Ambil semua ulasan (admin)
router.get("/", getReviews);

// ✅ Toggle rekomendasi menu (admin)
router.put("/menu/:foodId/recommendation", toggleMenuRecommendation);

// ✅ Ambil menu top rated
router.get("/top", getTopRatedMenus);

export default router;
