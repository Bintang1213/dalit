import Review from "../models/reviewModel.js";
import Food from "../models/foodModel.js";

// ==============================
// Tambah review (user)
// ==============================
export const addReview = async (req, res) => {
  try {
    const { userId, foodId, rating, comment } = req.body;

    if (!userId || !foodId || !rating) {
      return res.status(400).json({ message: "userId, foodId, dan rating wajib diisi" });
    }

    const review = new Review({ userId, foodId, rating, comment });
    await review.save();

    res.status(201).json({ success: true, review });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================
// Ambil semua review (admin)
// ==============================
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

// ==============================
// Toggle rekomendasi menu (admin)
// ==============================
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

// ==============================
// Ambil menu top rated (global) dengan nama menu
// ==============================
export const getTopRatedMenus = async (req, res) => {
  try {
    // Ambil aggregate rating semua review
    const topMenus = await Review.aggregate([
      {
        $match: { foodId: { $ne: null } }, // pastikan foodId valid
      },
      {
        $group: {
          _id: "$foodId",
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
      { $sort: { avgRating: -1 } },
      { $limit: 10 },
    ]);

    console.log("TopMenus Aggregate:", topMenus);

    if (!topMenus.length) return res.json([]); // kalau kosong langsung return []

    // Ambil detail nama dan status rekomendasi dari collection Food
    const foodIds = topMenus.map((t) => t._id);
    const foods = await Food.find({ _id: { $in: foodIds } });

    // Merge hasil aggregate dengan data Food
    const merged = topMenus.map((t) => {
      const food = foods.find((f) => f._id.toString() === t._id.toString());
      return {
        _id: t._id,
        name: food ? food.name : "Unknown",
        avgRating: t.avgRating,
        totalReviews: t.totalReviews,
        isRecommended: food ? food.isRecommended : false,
      };
    });

    res.json(merged);
  } catch (error) {
    console.error("Error fetching top menus:", error);
    res.status(500).json({ message: "Gagal ambil top menus", error: error.message });
  }
};
