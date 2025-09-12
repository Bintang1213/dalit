import express from 'express';
import authMiddleware from '../middleware/auth.js';
import chatModel from '../models/chatModel.js';

const chatRouter = express.Router();

chatRouter.post('/history', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.body;
    
    if (!conversationId) {
      return res.json({ success: false, message: "Conversation ID diperlukan" });
    }

    const chat = await chatModel.findOne({ conversationId });
    if (!chat) {
      return res.json({ success: false, message: "Percakapan tidak ditemukan" });
    }

    res.json({ success: true, data: chat.messages });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Gagal mengambil riwayat chat" });
  }
});

chatRouter.get('/admin/conversations', authMiddleware, async (req, res) => {
  if (!req.adminId) {
    return res.status(403).json({ success: false, message: "Akses ditolak" });
  }
  try {
    const conversations = await chatModel.find({}, { messages: { $slice: -1 } });
    res.json({ success: true, data: conversations });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Gagal mengambil daftar percakapan" });
  }
});

chatRouter.delete('/clear-all', authMiddleware, async (req, res) => {
  if (!req.adminId) {
    return res.status(403).json({ success: false, message: "Akses ditolak" });
  }
  try {
    await chatModel.deleteMany({});
    res.json({ success: true, message: "Semua chat berhasil dihapus!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Gagal menghapus semua chat" });
  }
});

export default chatRouter;
