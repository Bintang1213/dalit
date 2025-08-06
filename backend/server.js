import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import cartRouter from "./routes/cartRoute.js";
import adminRouter from "./routes/adminRoute.js";
import orderRouter from "./routes/orderRoute.js";
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

// Konfigurasi path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Konfigurasi CORS yang lebih fleksibel
const allowedOrigins = [
  'http://localhost:5173', // Vite default port
  'http://localhost:5174', // Port lain yang mungkin digunakan
  'https://1sj70g49-5173.asse.devtunnels.ms',
  'https://1sj70g49-5173.asse.devtunnels.ms',
  process.env.FRONTEND_URL // Jika ada environment variable
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files dengan CORS headers
app.use("/images", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", allowedOrigins.join(', '));
  res.header("Access-Control-Allow-Methods", "GET");
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Database connection
connectDB();

// API routes
app.use("/api/food", foodRouter);
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/admin", adminRouter);
app.use("/api/order", orderRouter);

// Test API
app.get("/", (req, res) => {
  res.send("API Working");
});

// Error handling untuk CORS
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({
      success: false,
      message: `Origin ${req.headers.origin} not allowed`,
      allowedOrigins
    });
  } else {
    next(err);
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server Started on http://localhost:${port}`);
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
});
