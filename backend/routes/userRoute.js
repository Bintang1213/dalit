import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
    loginUser,
    registerUser,
    getAllUsers,
    deleteUser,
    getUserProfile,
    updateUserProfile,
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/login", loginUser);
userRouter.post("/register", registerUser);
userRouter.get("/", getAllUsers);
userRouter.delete("/:id", deleteUser);
userRouter.get("/profile", authMiddleware, getUserProfile);
userRouter.put("/profile", authMiddleware, updateUserProfile);

export default userRouter;