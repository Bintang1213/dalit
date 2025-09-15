import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";


// Config & DB
import { connectDB } from "./config/db.js";

// Router
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import cartRouter from "./routes/cartRoute.js";
import adminRouter from "./routes/adminRoute.js";
import orderRouter from "./routes/orderRoute.js";
import chatRouter from "./routes/chatRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js"; // ✅ Router ulasan

// Model
import chatModel from "./models/chatModel.js";

dotenv.config();
// ✅ Tambahan voucher router
import voucherRouter from "./routes/voucherRoutes.js";
import voucherUsageRouter from "./routes/voucherUsageRoute.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 4000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// ✅ Middleware Socket untuk JWT
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Autentikasi gagal: Token tidak ditemukan"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.decoded = decoded;
    socket.userId = decoded.id;
    socket.adminId = decoded.adminId;
    socket.userType = decoded.adminId ? "Admin" : "User";
    next();
  } catch (error) {
    next(new Error("Autentikasi gagal: Token tidak valid"));
  }
});

// ✅ Allowed Origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://1sj70g49-5173.asse.devtunnels.ms",
  "http://192.168.1.6:4000",
  "http://localhost:8081",
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

// ✅ Middleware Express
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Static files
app.use(
  "/images",
  (req, res, next) => {
    res.header("Access-Control-Allow-Origin", allowedOrigins.join(", "));
    res.header("Access-Control-Allow-Methods", "GET");
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);

// ✅ Connect Database
connectDB();

app.use("/api/food", foodRouter);
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/admin", adminRouter);

// ✅ Route voucher usage (log pemakaian voucher)
app.use("/api/voucher-usage", voucherUsageRouter);

// ✅ Route order
app.use("/api/order", orderRouter);

// ✅ Route chat
app.use("/api/chat", chatRouter);
app.use("/api/reviews", reviewRoutes); // 👉 Route ulasan

// ✅ Route voucher
app.use("/api/vouchers", voucherRouter);

app.get("/", (req, res) => {
  res.send("API Working");
});

// ✅ Socket.IO Logic
io.on("connection", (socket) => {
  const userId = socket.userId;
  const adminId = socket.adminId;
  const userType = socket.userType;
  const identifier = userId || adminId;

  console.log(`${userType} terhubung: ${identifier}`);

  socket.on("join_chat", async (conversationId) => {
    try {
      if (!conversationId || typeof conversationId !== "string") {
        socket.emit("error_message", "Conversation ID tidak valid");
        return;
      }

      if (userId) {
        const match = conversationId.match(/^user_([a-f\d]{24})_admin$/);
        if (!match || match[1] !== userId.toString()) {
          socket.emit(
            "error_message",
            "Akses ditolak: Anda hanya bisa mengakses chat Anda sendiri"
          );
          return;
        }
      } else if (adminId) {
        if (!conversationId.match(/^user_[a-f\d]{24}_admin$/)) {
          socket.emit("error_message", "Format conversation ID tidak valid");
          return;
        }
      }

      if (socket.currentRoom) {
        socket.leave(socket.currentRoom);
      }

      socket.join(conversationId);
      socket.currentRoom = conversationId;
      console.log(
        `${userType} ${identifier} bergabung ke percakapan: ${conversationId}`
      );
      socket.emit("joined_chat", { conversationId, userType });
    } catch (error) {
      console.error("Error joining chat:", error);
      socket.emit("error_message", "Gagal bergabung ke chat");
    }
  });

  socket.on("send_message", async ({ conversationId, message, senderName }) => {
    try {
      if (!conversationId || !message) {
        socket.emit("error_message", "Data pesan tidak lengkap");
        return;
      }

      if (typeof message !== "string" || message.trim().length === 0) {
        socket.emit("error_message", "Pesan tidak boleh kosong");
        return;
      }
      if (message.length > 1000) {
        socket.emit(
          "error_message",
          "Pesan terlalu panjang (maksimal 1000 karakter)"
        );
        return;
      }

      if (userId) {
        const match = conversationId.match(/^user_([a-f\d]{24})_admin$/);
        if (!match || match[1] !== userId.toString()) {
          socket.emit(
            "error_message",
            "Akses ditolak: Anda hanya bisa mengirim pesan ke chat Anda sendiri"
          );
          return;
        }
      }

      if (socket.currentRoom !== conversationId) {
        socket.emit(
          "error_message",
          "Anda harus bergabung ke chat terlebih dahulu"
        );
        return;
      }

      const senderId = userId || adminId;
      const senderType = adminId ? "Admin" : "User";
      const finalSenderName = senderType === "User" ? senderName : "Admin";

      let chat = await chatModel.findOne({ conversationId });
      if (!chat) {
        let chatUserId = null;
        if (senderType === "User") {
          chatUserId = senderId;
        } else {
          const match = conversationId.match(/^user_([a-f\d]{24})_admin$/);
          chatUserId = match ? match[1] : null;
        }

        if (!chatUserId) {
          socket.emit("error_message", "Gagal menentukan user ID");
          return;
        }

        chat = new chatModel({
          conversationId,
          userId: chatUserId,
          userName:
            senderType === "User" ? finalSenderName : `Chat dengan User`,
        });
      }

      const newMessage = {
        senderId,
        senderType,
        senderName: finalSenderName,
        message: message.trim(),
        timestamp: new Date(),
      };

      chat.messages.push(newMessage);
      chat.lastMessageAt = new Date();
      await chat.save();

      console.log(
        `Pesan dari ${userType} ${identifier} ke room ${conversationId}: ${message.substring(
          0,
          50
        )}...`
      );

      const roomSockets = await io.in(conversationId).fetchSockets();
      console.log(
        `Jumlah client di room ${conversationId}: ${roomSockets.length}`
      );
      io.to(conversationId).emit("receive_message", {
        ...newMessage,
        conversationId,
      });
    } catch (error) {
      console.error("Error mengirim pesan:", error);
      socket.emit("error_message", "Gagal mengirim pesan");
    }
  });

  socket.on("rejoin_chat", async (conversationId) => {
    socket.emit("join_chat", conversationId);
  });

  socket.on("typing_start", ({ conversationId }) => {
    if (socket.currentRoom === conversationId) {
      socket.to(conversationId).emit("user_typing", {
        userId: identifier,
        userType,
        isTyping: true,
      });
    }
  });

  socket.on("typing_stop", ({ conversationId }) => {
    if (socket.currentRoom === conversationId) {
      socket.to(conversationId).emit("user_typing", {
        userId: identifier,
        userType,
        isTyping: false,
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(`${userType} terputus: ${identifier}`);
    if (socket.currentRoom) {
      socket.to(socket.currentRoom).emit("user_disconnect", {
        userId: identifier,
        userType,
      });
    }
  });

  socket.on("error", (error) => {
    console.error(`Socket error for ${userType} ${identifier}:`, error);
  });
});

// ✅ Error Handling
app.use((err, req, res, next) => {
  if (err.message === "Not allowed by CORS") {
    res.status(403).json({
      success: false,
      message: `Origin ${req.headers.origin} not allowed`,
      allowedOrigins,
    });
  } else {
    next(err);
  }
});

// ✅ Start Server
server.listen(port, () => {
  console.log(`Server Started on http://localhost:${port}`);
  console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);
});
