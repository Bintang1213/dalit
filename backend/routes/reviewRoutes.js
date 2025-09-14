// backend/routes/reviewRoutes.js
import express from "express";
import {
  addReview,
  getReviews,
  toggleMenuRecommendation,
  updateReviewStatus,
  getTopRatedMenus,
} from "../controllers/reviewController.js";

const router = express.Router();

// ✅ Tambah ulasan (user)
router.post("/", addReview);

// ✅ Ambil semua ulasan (admin)
router.get("/", getReviews);

// ✅ Update status review (approve/tolak)
router.put("/:id/status", updateReviewStatus);

// ✅ Toggle rekomendasi menu (admin)
router.put("/menu/:foodId/recommend", toggleMenuRecommendation);

// ✅ Ambil menu top rated
router.get("/top-rated", getTopRatedMenus);

export default router;
