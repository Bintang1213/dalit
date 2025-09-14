// backend/controllers/reviewController.js
import Review from "../models/reviewModel.js";
import User from "../models/userModel.js";   // untuk populate user
import Food from "../models/foodModel.js";   // untuk populate makanan

// Tambah review (user)
export const addReview = async (req, res) => {
  try {
    const { userId, foodId, rating, comment } = req.body;

    if (!userId || !foodId || !rating) {
      return res.status(400).json({ message: "userId, foodId, dan rating wajib diisi" });
    }

    const review = new Review({ userId, foodId, rating, comment, approved: false }); // default belum approved
    await review.save();

    console.log("Review saved:", review);
    res.status(201).json({ success: true, review });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Ambil semua review (admin)
export const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("userId", "name email")
      .populate("foodId", "name price");

    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Gagal ambil review", error: error.message });
  }
};

// Toggle rekomendasi menu (admin)
export const toggleMenuRecommendation = async (req, res) => {
  try {
    const { foodId } = req.params;
    const food = await Food.findById(foodId);

    if (!food) return res.status(404).json({ message: "Menu tidak ditemukan" });

    food.isRecommended = !food.isRecommended;
    await food.save();

    res.json({ success: true, food });
  } catch (error) {
    console.error("Error toggling recommendation:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update status review (approve/tolak) (admin)
export const updateReviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved } = req.body; // boolean true/false

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: "Review tidak ditemukan" });

    review.approved = approved;
    await review.save();

    res.json({ success: true, review });
  } catch (error) {
    console.error("Error updating review status:", error);
    res.status(500).json({ message: error.message });
  }
};

// Ambil menu top rated (global)
export const getTopRatedMenus = async (req, res) => {
  try {
    const topMenus = await Review.aggregate([
      { $match: { approved: true } },
      {
        $group: {
          _id: "$foodId",
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 }
        }
      },
      { $sort: { avgRating: -1 } },
      { $limit: 10 }
    ]);

    const foods = await Food.find({ _id: { $in: topMenus.map(t => t._id) } });

    res.json({ topMenus, foods });
  } catch (error) {
    console.error("Error fetching top menus:", error);
    res.status(500).json({ message: error.message });
  }
};
