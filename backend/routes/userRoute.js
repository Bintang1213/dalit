import express from "express";
import authMiddleware from "../middleware/auth.js";
import { loginUser, registerUser, getAllUsers, deleteUser, getUserProfile } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/login", loginUser);
userRouter.post("/register", registerUser);
userRouter.get("/", getAllUsers); // Menggunakan salah satu dari dua rute yang sama
userRouter.delete("/:id", deleteUser);
userRouter.get("/profile", authMiddleware, getUserProfile);


export default userRouter;