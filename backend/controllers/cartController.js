import userModel from "../models/userModel.js";

// Tambahkan item ke keranjang
const addToCart = async (req, res) => {
  try {
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({ success: false, message: "Item ID diperlukan" });
    }

    const userId = req.userId; // ← gunakan hasil dari middleware

    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan" });
    }

    let cartData = userData.cartData || {};
    cartData[itemId] = cartData[itemId] ? cartData[itemId] + 1 : 1;

    await userModel.findByIdAndUpdate(userId, { cartData });
    res.json({ success: true, message: "Item berhasil ditambahkan ke keranjang" });
  } catch (error) {
    console.log("Add to Cart Error:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
  }
};

// Hapus item dari keranjang
const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.body;
    const userId = req.userId;

    let userData = await userModel.findById(userId);
    let cartData = userData.cartData || {};

    if (cartData[itemId] > 0) {
      cartData[itemId] -= 1;
    }

    await userModel.findByIdAndUpdate(userId, { cartData });
    res.json({ success: true, message: "Item berhasil dihapus dari keranjang" });
  } catch (error) {
    console.log("Error removing from cart:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan saat menghapus item" });
  }
};

// Ambil data keranjang user
const getCart = async (req, res) => {
  try {
    const userId = req.userId;

    let userData = await userModel.findById(userId);
    let cartData = userData.cartData || {};
    res.json({ success: true, cartData });
  } catch (error) {
    console.log("Error fetching cart:", error);
    res.status(500).json({ success: false, message: "Terjadi kesalahan saat mengambil data keranjang" });
  }
};

export { addToCart, removeFromCart, getCart };
