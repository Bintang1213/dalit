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
import http from 'http';
import { Server } from 'socket.io';
import chatRouter from "./routes/chatRoutes.js";
import chatModel from "./models/chatModel.js";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ["GET", "POST"]
  }
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Autentikasi gagal: Token tidak ditemukan"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.decoded = decoded;
    next();
  } catch (error) {
    next(new Error("Autentikasi gagal: Token tidak valid"));
  }
});

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://1sj70g49-5173.asse.devtunnels.ms',
  'http://192.168.1.6:4000',
  'http://localhost:8081',
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
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

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/images", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", allowedOrigins.join(', '));
  res.header("Access-Control-Allow-Methods", "GET");
  next();
}, express.static(path.join(__dirname, 'uploads')));

connectDB();

app.use("/api/food", foodRouter);
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/admin", adminRouter);
app.use("/api/order", orderRouter);
app.use("/api/chat", chatRouter);

app.get("/", (req, res) => {
  res.send("API Working");
});

io.on('connection', (socket) => {
  console.log(`User/Admin terhubung: ${socket.decoded.id || socket.decoded.adminId}`);

  socket.on('join_chat', (conversationId) => {
    socket.join(conversationId);
    console.log(`${socket.decoded.id || socket.decoded.adminId} bergabung ke percakapan: ${conversationId}`);
  });

  socket.on('send_message', async ({ conversationId, message, senderName }) => {
    try {
      const senderId = socket.decoded.id || socket.decoded.adminId;
      const senderType = socket.decoded.adminId ? 'Admin' : 'User';

      let chat = await chatModel.findOne({ conversationId });
      if (!chat) {
        chat = new chatModel({
          conversationId,
          // Gunakan senderName jika ada, jika tidak, gunakan "Pengguna"
          userName: senderType === 'User' ? senderName : 'Admin'
        });
      }

      chat.messages.push({
        senderId,
        senderType,
        message,
        // Simpan senderName di setiap pesan
        senderName: senderType === 'User' ? senderName : 'Admin'
      });

      await chat.save();

      io.to(conversationId).emit('receive_message', chat.messages.slice(-1)[0]);
    } catch (error) {
      console.error('Error mengirim pesan:', error);
      socket.emit('error_message', 'Gagal mengirim pesan');
    }
  });

  socket.on('disconnect', () => {
    console.log(`User/Admin terputus: ${socket.decoded.id || socket.decoded.adminId}`);
  });
});

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

server.listen(port, () => {
  console.log(`Server Started on http://localhost:${port}`);
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
});