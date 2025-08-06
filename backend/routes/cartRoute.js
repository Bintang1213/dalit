import express from "express";
import { addToCart, removeFromCart, getCart } from "../controllers/cartController.js";
import authMiddleware from "../middleware/auth.js";

const cartRouter = express.Router();

// Menambahkan item ke keranjang
cartRouter.post("/add", authMiddleware, addToCart);

// Menghapus item dari keranjang
cartRouter.post("/remove", authMiddleware, removeFromCart);

// Mengambil data keranjang user
cartRouter.post("/get", authMiddleware, getCart);

export default cartRouter;
