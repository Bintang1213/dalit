import express from "express";
import authMiddleware from "../middleware/auth.js";
import chatModel from "../models/chatModel.js";

const chatRouter = express.Router();

// ✅ ROUTE KHUSUS: Ambil conversationId user (UNTUK NAVBAR)
chatRouter.get(
  "/user/conversation-id",
  authMiddleware,
  async (req, res) => {
    try {
      if (!req.userId) {
        return res.status(403).json({
          success: false,
          message: "Akses ditolak",
        });
      }

      const conversationId = `user_${req.userId}_admin`;

      res.json({
        success: true,
        conversationId,
      });
    } catch (error) {
      console.error("Error get conversationId:", error);
      res.status(500).json({
        success: false,
        message: "Gagal mengambil conversationId",
      });
    }
  }
);


// ✅ PERBAIKAN MASALAH 1: Route untuk user mengambil chat history mereka
chatRouter.get("/user/history", authMiddleware, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(403).json({
        success: false,
        message:
          "Akses ditolak: Hanya pengguna yang bisa melihat chatnya sendiri",
      });
    }

    const conversationId = `user_${req.userId}_admin`;

    // ✅ PERBAIKAN: Buat chat jika belum ada
    let chat = await chatModel.findOne({ conversationId });

    if (!chat) {
      // Buat chat baru jika belum ada
      chat = new chatModel({
        conversationId,
        userId: req.userId,
        userName: "User", // Default name, bisa diupdate nanti
        messages: [],
        isActive: true,
        lastMessageAt: new Date(),
      });
      await chat.save();

      return res.json({
        success: true,
        data: [],
        conversationId: conversationId,
        message: "Chat baru dibuat",
      });
    }

    res.json({
      success: true,
      data: chat.messages,
      conversationId: conversationId,
    });
  } catch (error) {
    console.error("Error fetching user chat history:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil riwayat chat",
    });
  }
});

// Route untuk mengambil riwayat chat spesifik untuk admin
chatRouter.post("/admin/history", authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.body;

    if (!req.adminId) {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak: Hanya admin yang dapat melihat riwayat chat",
      });
    }

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: "Conversation ID diperlukan",
      });
    }

    // ✅ VALIDASI: Pastikan format conversationId benar
    if (!conversationId.match(/^user_[a-f\d]{24}_admin$/)) {
      return res.status(400).json({
        success: false,
        message: "Format conversation ID tidak valid",
      });
    }

    const chat = await chatModel.findOne({ conversationId });
    if (!chat) {
      return res.json({
        success: false,
        message: "Percakapan tidak ditemukan",
      });
    }

    res.json({
      success: true,
      data: chat.messages,
      conversationId: conversationId,
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil riwayat chat",
    });
  }
});

// ✅ PERBAIKAN: Route untuk inisialisasi chat user
chatRouter.post("/user/initialize", authMiddleware, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak",
      });
    }

    const { userName } = req.body;
    const conversationId = `user_${req.userId}_admin`;

    let chat = await chatModel.findOne({ conversationId });

    if (!chat) {
      chat = new chatModel({
        conversationId,
        userId: req.userId,
        userName: userName || "User",
        messages: [],
        isActive: true,
        lastMessageAt: new Date(),
      });
      await chat.save();
    } else if (userName && chat.userName !== userName) {
      // Update nama user jika berbeda
      chat.userName = userName;
      await chat.save();
    }

    res.json({
      success: true,
      conversationId: conversationId,
      message: "Chat berhasil diinisialisasi",
    });
  } catch (error) {
    console.error("Error initializing chat:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menginisialisasi chat",
    });
  }
});

// Get semua conversations untuk admin
chatRouter.get("/admin/conversations", authMiddleware, async (req, res) => {
  if (!req.adminId) {
    return res.status(403).json({
      success: false,
      message: "Akses ditolak",
    });
  }

  try {
    const conversations = await chatModel
      .find(
        { isActive: true },
        {
          conversationId: 1,
          userName: 1,
          userId: 1,
          lastMessageAt: 1,
          updatedAt: 1,
          messages: { $slice: -1 },
        },
      )
      .sort({ lastMessageAt: -1 })
      .limit(100);

    res.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil daftar percakapan",
    });
  }
});

// ✅ TAMBAHAN: Route untuk debug - cek status room
chatRouter.get("/debug/room-status", authMiddleware, async (req, res) => {
  try {
    if (!req.userId && !req.adminId) {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak",
      });
    }

    const conversationId = req.userId
      ? `user_${req.userId}_admin`
      : req.query.conversationId;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: "Conversation ID diperlukan untuk admin",
      });
    }

    const chat = await chatModel.findOne({ conversationId });

    res.json({
      success: true,
      data: {
        conversationId,
        chatExists: !!chat,
        isActive: chat?.isActive || false,
        messageCount: chat?.messages?.length || 0,
        lastMessageAt: chat?.lastMessageAt,
        userName: chat?.userName,
      },
    });
  } catch (error) {
    console.error("Error checking room status:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengecek status room",
    });
  }
});

// Menghapus semua chat
chatRouter.delete("/admin/clear-all", authMiddleware, async (req, res) => {
  if (!req.adminId) {
    return res.status(403).json({
      success: false,
      message: "Akses ditolak",
    });
  }

  try {
    const result = await chatModel.deleteMany({});
    console.log(`Admin ${req.adminId} menghapus ${result.deletedCount} chat`);

    res.json({
      success: true,
      message: `${result.deletedCount} chat berhasil dihapus!`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error clearing all chats:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menghapus semua chat",
    });
  }
});

// Statistik chat untuk admin
chatRouter.get("/admin/stats", authMiddleware, async (req, res) => {
  if (!req.adminId) {
    return res.status(403).json({
      success: false,
      message: "Akses ditolak",
    });
  }

  try {
    const totalChats = await chatModel.countDocuments({ isActive: true });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayChats = await chatModel.countDocuments({
      isActive: true,
      lastMessageAt: { $gte: today },
    });

    const unreadChats = await chatModel.countDocuments({
      isActive: true,
      "messages.senderType": "User",
      lastMessageAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    res.json({
      success: true,
      data: {
        totalChats,
        todayChats,
        unreadChats,
      },
    });
  } catch (error) {
    console.error("Error fetching chat stats:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil statistik chat",
    });
  }
});

// Mengarsipkan chat
chatRouter.patch(
  "/admin/archive/:conversationId",
  authMiddleware,
  async (req, res) => {
    if (!req.adminId) {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak",
      });
    }

    try {
      const { conversationId } = req.params;

      const chat = await chatModel.findOneAndUpdate(
        { conversationId },
        { isActive: false },
        { new: true },
      );

      if (!chat) {
        return res.status(404).json({
          success: false,
          message: "Chat tidak ditemukan",
        });
      }

      res.json({
        success: true,
        message: "Chat berhasil diarsipkan",
      });
    } catch (error) {
      console.error("Error archiving chat:", error);
      res.status(500).json({
        success: false,
        message: "Gagal mengarsipkan chat",
      });
    }
  },
);

export default chatRouter;
