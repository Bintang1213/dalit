import express from 'express';
import Order from '../models/order.js';
import User from '../models/userModel.js';
import authMiddleware from '../middleware/auth.js';
import snap from '../config/midtrans.js';
import moment from 'moment-timezone';
import midtransClient from 'midtrans-client';
import Voucher from "../models/voucherModel.js";
import VoucherUsage from "../models/voucherUsageModel.js";

const router = express.Router();

// =============================
// Helper untuk respon error
// =============================
const errorResponse = (res, status, message) => {
    return res.status(status).json({
        success: false,
        message
    });
};

const coreApi = new midtransClient.CoreApi({
    isProduction: process.env.NODE_ENV === 'production',
    serverKey: process.env.MIDTRANS_SERVER_KEY,
});

// =============================
// GET semua order (admin only)
// =============================
router.get("/", authMiddleware, async (req, res) => {
    try {
        if (!req.adminId) {
            return errorResponse(res, 403, "Hanya admin yang bisa mengakses daftar pesanan");
        }

        const orders = await Order.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: orders.length, data: orders });
    } catch (error) {
        console.error("[ERROR] Failed to fetch orders:", error);
        errorResponse(res, 500, "Terjadi kesalahan server");
    }
});

// =============================
// GET order user login
// =============================
router.get("/user", authMiddleware, async (req, res) => {
    try {
      if (!req.userId) {
        return errorResponse(res, 403, "Akses ditolak");
      }
  
      const orders = await Order.find({ userId: req.userId }).sort({ createdAt: -1 }).lean();
  
      // Pastikan reviewed selalu ada (default false kalau undefined)
      const data = orders.map(o => ({
        ...o,
        reviewed: o.reviewed || false,
      }));
  
      res.status(200).json({ success: true, count: data.length, data });
    } catch (error) {
      console.error("[ERROR] Failed to fetch user orders:", error);
      errorResponse(res, 500, "Terjadi kesalahan server");
    }
  });
  

// =============================
// GET order by ID
// =============================
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId);

        if (!order) return errorResponse(res, 404, "Pesanan tidak ditemukan");

        if (!req.adminId && order.userId.toString() !== req.userId) {
            return errorResponse(res, 403, "Anda tidak memiliki akses ke pesanan ini");
        }

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        console.error("[ERROR] Failed to fetch order:", error);
        errorResponse(res, 500, "Terjadi kesalahan server");
    }
});

// =============================
// POST buat order baru
// =============================
router.post("/", authMiddleware, async (req, res) => {
    try {
        const {
            name,
            tableNumber,
            phone,
            address,
            note,
            payment,
            method,
            items,
            subtotal,
            discount,
            totalAmount,
            voucherType,
            voucherValue,
            voucherId
        } = req.body;

        if (!name || !payment || !method || !items || items.length === 0 || !totalAmount || totalAmount <= 0) {
            return errorResponse(res, 400, "Data pesanan tidak lengkap atau tidak valid.");
        }

        if (method === "Makan di Tempat" && (!tableNumber || isNaN(tableNumber) || parseInt(tableNumber) <= 0)) {
            return errorResponse(res, 400, "Nomor Meja wajib diisi dan harus berupa angka positif.");
        }
        if (method === "Diantar") {
            if (!phone || !/^[0-9]{10,15}$/.test(phone)) {
                return errorResponse(res, 400, "Nomor Telepon wajib 10-15 digit angka.");
            }
            if (!address || address.length < 5) {
                return errorResponse(res, 400, "Alamat minimal 5 karakter.");
            }
        }

        const user = await User.findById(req.userId);
        if (!user) return errorResponse(res, 404, "Pengguna tidak ditemukan.");
        const userEmail = user.email;

        // =============================
        // Hitung ulang total di backend
        // =============================
        const subtotalFromItems = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const serviceFee = Math.round(subtotalFromItems * 0.1);
        const deliveryFee = method === "Diantar" ? 10000 : 0;
        let backendTotal = subtotalFromItems + serviceFee + deliveryFee;

        // =============================
        // Validasi Voucher
        // =============================
        let finalDiscount = 0;
        if (voucherId) {
            const voucher = await Voucher.findById(voucherId);
            if (!voucher) {
                return errorResponse(res, 404, "Voucher tidak ditemukan");
            }

            // Cek tanggal aktif
            const now = new Date();
            if (now < voucher.startDate || now > voucher.endDate) {
                return errorResponse(res, 400, "Voucher tidak berlaku");
            }

            // Cek minimal belanja
            if (subtotalFromItems < voucher.minPurchase) {
                return errorResponse(res, 400, `Minimal belanja Rp ${voucher.minPurchase}`);
            }

            // Cek pemakaian per hari
            const startOfDay = new Date(now.setHours(0, 0, 0, 0));
            const endOfDay = new Date(now.setHours(23, 59, 59, 999));
            const usageToday = await VoucherUsage.countDocuments({
                voucherId,
                usedAt: { $gte: startOfDay, $lte: endOfDay }
            });

            if (voucher.maxUsagePerDay > 0 && usageToday >= voucher.maxUsagePerDay) {
                return errorResponse(res, 400, "Kuota voucher hari ini habis");
            }

            // Cek pemakaian per user
            const usageByUser = await VoucherUsage.countDocuments({
                voucherId,
                userId: req.userId,
                usedAt: { $gte: startOfDay, $lte: endOfDay }
            });

            if (voucher.maxUsagePerUser > 0 && usageByUser >= voucher.maxUsagePerUser) {
                return errorResponse(res, 400, "Kamu sudah menggunakan voucher ini hari ini");
            }

            // Hitung diskon
            if (voucher.discountType === "percent") {
                finalDiscount = Math.round((voucher.discountValue / 100) * subtotalFromItems);
            } else {
                finalDiscount = voucher.discountValue;
            }

            // Catat penggunaan voucher
            await VoucherUsage.create({
                voucherId,
                userId: req.userId,
                usedAt: new Date(),
            });

            backendTotal -= finalDiscount;
        }

        // =============================
        // Simpan order
        // =============================
        const newOrder = new Order({
            userId: req.userId,
            name,
            tableNumber: method === "Makan di Tempat" ? tableNumber : undefined,
            phone: method === "Diantar" ? phone : undefined,
            address: method === "Diantar" ? address : undefined,
            note,
            payment,
            method,
            items,
            subtotal: subtotalFromItems,
            discount: finalDiscount,
            totalAmount: backendTotal,
            serviceFee,
            deliveryFee,
            status: payment === "Tunai" ? "Menunggu Konfirmasi" : "Menunggu Pembayaran",
            createdAt: moment().tz('Asia/Jakarta').toDate(),
            updatedAt: moment().tz('Asia/Jakarta').toDate(),
        });

        const savedOrder = await newOrder.save();

        // =============================
        // Midtrans jika non-tunai
        // =============================
        if (payment === "Non-Tunai") {
            const midtransItems = items.map(item => ({
                id: item._id.toString(),
                price: Math.round(item.price),
                quantity: item.quantity,
                name: item.name,
            }));

            if (serviceFee > 0) {
                midtransItems.push({ id: 'service-fee', price: serviceFee, quantity: 1, name: 'Biaya Layanan' });
            }
            if (deliveryFee > 0) {
                midtransItems.push({ id: 'delivery-fee', price: deliveryFee, quantity: 1, name: 'Ongkos Kirim' });
            }
            if (finalDiscount > 0) {
                midtransItems.push({ id: 'voucher', price: -finalDiscount, quantity: 1, name: 'Diskon Voucher' });
            }

            const parameter = {
                transaction_details: {
                    order_id: savedOrder._id.toString(),
                    gross_amount: Math.round(backendTotal),
                },
                customer_details: {
                    first_name: name,
                    email: userEmail,
                    phone: phone || user.phone || '081234567890',
                    address: address || user.address || 'No Address',
                },
                item_details: midtransItems
            };

            const transaction = await snap.createTransaction(parameter);

            savedOrder.midtransToken = transaction.token;
            savedOrder.midtransRedirectUrl = transaction.redirect_url;
            await savedOrder.save();

            return res.status(201).json({
                success: true,
                message: "Pesanan berhasil dibuat, menanti pembayaran.",
                order: savedOrder,
                token: transaction.token,
                redirect_url: transaction.redirect_url,
            });
        } else {
            return res.status(201).json({
                success: true,
                message: "Pesanan berhasil dibuat, menunggu konfirmasi.",
                order: savedOrder,
            });
        }

    } catch (error) {
        console.error("[ERROR] Failed to create order:", error);
        res.status(500).json({ success: false, message: "Terjadi kesalahan server.", error: error.message });
    }
});

// =============================
// Midtrans Notification
// =============================
router.post("/midtrans-notification", async (req, res) => {
    try {
        const notification = req.body;
        const statusResponse = await coreApi.transaction.notification(notification);

        const { order_id, transaction_status, fraud_status } = statusResponse;
        const order = await Order.findById(order_id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        let newStatus;
        if (transaction_status === 'capture') {
            newStatus = fraud_status === 'challenge' ? 'Challenged' : 'Pembayaran Berhasil';
        } else if (transaction_status === 'settlement') newStatus = 'Pembayaran Berhasil';
        else if (transaction_status === 'pending') newStatus = 'Menunggu Pembayaran';
        else if (['cancel', 'expire', 'deny'].includes(transaction_status)) newStatus = 'Pembayaran Dibatalkan';
        else if (['refund', 'partial_refund'].includes(transaction_status)) newStatus = 'Refunded';
        else newStatus = 'Unknown';

        order.status = newStatus;
        order.updatedAt = moment().tz('Asia/Jakarta').toDate();
        await order.save();

        res.status(200).json({ message: "Notification processed" });
    } catch (error) {
        console.error("[ERROR] Midtrans notification:", error);
        res.status(500).json({ message: "Error processing notification", error: error.message });
    }
});

// =============================
// PATCH update order status (Admin)
// =============================
router.patch("/:id", authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const orderId = req.params.id;

        const order = await Order.findByIdAndUpdate(
            orderId,
            { status, updatedAt: moment().tz('Asia/Jakarta').toDate() },
            { new: true }
        );

        if (!order) return errorResponse(res, 404, "Pesanan tidak ditemukan");

        res.status(200).json({ success: true, message: "Status pesanan diperbarui", data: order });
    } catch (error) {
        console.error("[ERROR] Update order:", error);
        res.status(500).json({ success: false, message: "Terjadi kesalahan server", error: error.message });
    }
});

// =============================
// DELETE order (Admin)
// =============================
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findOneAndDelete({ _id: orderId });

        if (!order) return errorResponse(res, 404, "Pesanan tidak ditemukan");

        res.status(200).json({ success: true, message: "Pesanan berhasil dihapus" });
    } catch (error) {
        console.error("[ERROR] Delete order:", error);
        res.status(500).json({ success: false, message: "Terjadi kesalahan server", error: error.message });
    }
});

export default router;