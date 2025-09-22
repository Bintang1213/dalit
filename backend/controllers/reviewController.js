import Review from "../models/reviewModel.js";
import Food from "../models/foodModel.js";
import Order from "../models/order.js";

// ==============================
// Tambah review (user) - hanya sekali per order per user
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

    // Ambil foodId pertama (atau sesuaikan kalau ada multi item)
    const foodId = order.items[0]?._id;

    const review = new Review({ userId, orderId, foodId, rating, comment });
    await review.save();

    // tandai order sudah direview
    order.reviewed = true;
    await order.save();

    res.status(201).json({ success: true, review });
  } catch (err) {
    console.error("Error add review:", err);
    res.status(500).json({ message: err.message });
  }
};

// ==============================
// Ambil review berdasarkan orderId (untuk lihat rating user)
// ==============================
export const getReviewByOrder = async (req, res) => {
  try {
    const { orderId, userId } = req.params;

    const review = await Review.findOne({ orderId, userId })
      .populate("userId", "name email")
      .populate("foodId", "name");

    if (!review) {
      return res.json({ reviewed: false, review: null });
    }

    res.json({ reviewed: true, review });
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
