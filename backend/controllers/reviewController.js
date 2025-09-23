// controllers/reviewController.js
import Review from "../models/reviewModel.js";
import Food from "../models/foodModel.js";
import Order from "../models/order.js";

// ==============================
// Tambah review (user) - sekali per order, tapi berlaku ke semua menu dalam order
// ==============================
export const addReview = async (req, res) => {
  try {
    const { userId, orderId, rating, comment } = req.body;

    if (!userId || !orderId || !rating) {
      return res
        .status(400)
        .json({ message: "userId, orderId, dan rating wajib diisi" });
    }

    // cek sudah ada review dari user ini untuk order ini
    const existingReview = await Review.findOne({ userId, orderId });
    if (existingReview) {
      return res
        .status(400)
        .json({ message: "Pesanan ini sudah diberi rating oleh user ini." });
    }

    // ambil pesanan
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Pesanan tidak ditemukan" });

    if (!order.items || order.items.length === 0) {
      return res.status(400).json({ message: "Pesanan tidak memiliki item" });
    }

    // buat review untuk setiap item di order
    const reviewDocs = order.items.map((item) => ({
      userId,
      orderId,
      foodId: item._id || item.foodId, // sesuaikan field yang dipakai di model Order
      rating,
      comment,
    }));

    const reviews = await Review.insertMany(reviewDocs);

    // tandai order sudah direview
    order.reviewed = true;
    await order.save();

    res.status(201).json({ success: true, reviews });
  } catch (err) {
    console.error("Error add review:", err);
    res.status(500).json({ message: err.message });
  }
};

// ==============================
// Ambil review berdasarkan orderId + userId
// ==============================
export const getReviewByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "userId wajib dikirim di query" });
    }

    const reviews = await Review.find({ orderId, userId })
      .populate("userId", "name email")
      .populate("foodId", "name");

    if (!reviews.length) {
      return res.json({ reviewed: false, reviews: [] });
    }

    res.json({ reviewed: true, reviews });
  } catch (err) {
    console.error("Error get review by order:", err);
    res.status(500).json({ message: err.message });
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
  } catch (err) {
    console.error("Error get reviews:", err);
    res.status(500).json({ message: err.message });
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
  } catch (err) {
    console.error("Error toggle recommendation:", err);
    res.status(500).json({ message: err.message });
  }
};

// ==============================
// Ambil menu top rated (10 teratas)
// ==============================
export const getTopRatedMenus = async (req, res) => {
  try {
    const topMenus = await Review.aggregate([
      { $match: { foodId: { $ne: null } } },
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

    if (!topMenus.length) return res.json([]);

    const foodIds = topMenus.map((t) => t._id);
    const foods = await Food.find({ _id: { $in: foodIds } });

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
  } catch (err) {
    console.error("Error get top menus:", err);
    res.status(500).json({ message: err.message });
  }
};
