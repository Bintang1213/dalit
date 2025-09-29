import express from 'express';
import authMiddleware from '../middleware/auth.js';
import Notification from '../models/notificationModel.js'; 
import mongoose from 'mongoose';

const router = express.Router();

// Helper untuk respon error
const errorResponse = (res, status, message) => {
    return res.status(status).json({ success: false, message });
};


router.get("/", authMiddleware, async (req, res) => {
    try {
        if (!req.userId) {
            return errorResponse(res, 403, "Akses ditolak. Pengguna tidak terautentikasi.");
        }

        // Filter: Hanya ambil yang belum dibaca (isRead: false)
        const filter = req.query.filter === 'all' ? {} : { isRead: false }; 

        const notifications = await Notification.find({ 
            userId: req.userId,
            ...filter
        })
        .sort({ createdAt: -1 })
        .limit(20) 
        .select('-userId -__v'); 
        res.status(200).json({ 
            success: true, 
            count: notifications.length, 
            data: notifications 
        });

    } catch (error) {
        console.error("[ERROR] Failed to fetch notifications:", error);
        errorResponse(res, 500, "Terjadi kesalahan server");
    }
});



router.get("/unread-count", authMiddleware, async (req, res) => {
    try {
        if (!req.userId) {
            return errorResponse(res, 403, "Akses ditolak.");
        }

        const count = await Notification.countDocuments({
            userId: req.userId,
            isRead: false
        });

        res.status(200).json({ 
            success: true, 
            count: count 
        });

    } catch (error) {
        console.error("[ERROR] Failed to count unread notifications:", error);
        errorResponse(res, 500, "Terjadi kesalahan server");
    }
});



router.patch("/", authMiddleware, async (req, res) => {
    try {
        if (!req.userId) {
            return errorResponse(res, 403, "Akses ditolak.");
        }

        const { notificationId } = req.body;

        let result;
        if (notificationId) {
            // Tandai notifikasi spesifik
            if (!mongoose.Types.ObjectId.isValid(notificationId)) {
                return errorResponse(res, 400, "ID notifikasi tidak valid");
            }
            result = await Notification.findOneAndUpdate(
                { _id: notificationId, userId: req.userId, isRead: false },
                { $set: { isRead: true } }
            );
            if (!result) {
                return errorResponse(res, 404, "Notifikasi tidak ditemukan atau sudah dibaca");
            }
        } else {
            // Tandai semua notifikasi pengguna sebagai sudah dibaca
            result = await Notification.updateMany(
                { userId: req.userId, isRead: false },
                { $set: { isRead: true } }
            );
        }

        res.status(200).json({ 
            success: true, 
            message: notificationId 
                ? "Notifikasi berhasil ditandai sebagai sudah dibaca" 
                : `${result.modifiedCount} notifikasi berhasil ditandai sebagai sudah dibaca` 
        });

    } catch (error) {
        console.error("[ERROR] Failed to mark notification as read:", error);
        errorResponse(res, 500, "Terjadi kesalahan server");
    }
});



router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        if (!req.userId) {
            return errorResponse(res, 403, "Akses ditolak.");
        }

        const notificationId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
            return errorResponse(res, 400, "ID notifikasi tidak valid");
        }

        const result = await Notification.findOneAndDelete({ 
            _id: notificationId, 
            userId: req.userId 
        });

        if (!result) {
            return errorResponse(res, 404, "Notifikasi tidak ditemukan");
        }

        res.status(200).json({ success: true, message: "Notifikasi berhasil dihapus" });

    } catch (error) {
        console.error("[ERROR] Failed to delete notification:", error);
        errorResponse(res, 500, "Terjadi kesalahan server");
    }
});


export default router;