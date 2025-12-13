import express from "express";
import Order from "../models/order.js";
import Notification from "../models/notificationModel.js";
import User from "../models/userModel.js";
import authMiddleware from "../middleware/auth.js";
import snap from "../config/midtrans.js";
import moment from "moment-timezone";
import midtransClient from "midtrans-client";
import Voucher from "../models/voucherModel.js";
import VoucherUsage from "../models/voucherUsageModel.js";

// Inisialisasi Core API Midtrans
const coreApi = new midtransClient.CoreApi({
    isProduction: process.env.NODE_ENV === "production",
    serverKey: process.env.MIDTRANS_SERVER_KEY,
});

const FRONTEND_BASE_URL = process.env.FRONTEND_URL || "https://kedaiwartiyem.my.id";

// 💡 DEEP LINK SCHEME UNTUK APLIKASI FLUTTER
const DEEP_LINK_SCHEME = "kedaiwartiyem"; 

export default (io) => {
    const router = express.Router();

    // Fungsi utilitas untuk respons error
    const errorResponse = (res, status, message) => {
        return res.status(status).json({
            success: false,
            message,
        });
    };

    // =======================================================
    // GET semua order (Admin Only)
    // =======================================================
    router.get("/", authMiddleware, async (req, res) => {
        try {
            if (!req.adminId) {
                return errorResponse(
                    res,
                    403,
                    "Hanya admin yang bisa mengakses daftar pesanan",
                );
            }

            const orders = await Order.find().sort({ createdAt: -1 });
            res
                .status(200)
                .json({ success: true, count: orders.length, data: orders });
        } catch (error) {
            console.error("[ERROR] Failed to fetch orders:", error);
            errorResponse(res, 500, "Terjadi kesalahan server");
        }
    });

    // =======================================================
    // GET order user login
    // =======================================================
    router.get("/user", authMiddleware, async (req, res) => {
        try {
            if (!req.userId) {
                return errorResponse(res, 403, "Akses ditolak");
            }

            const orders = await Order.find({ userId: req.userId })
                .sort({ createdAt: -1 })
                .lean();

            const data = orders.map((o) => ({
                ...o,
                reviewed: o.reviewed || false,
            }));

            res.status(200).json({ success: true, count: data.length, data });
        } catch (error) {
            console.error("[ERROR] Failed to fetch user orders:", error);
            errorResponse(res, 500, "Terjadi kesalahan server");
        }
    });

    // =======================================================
    // GET order status by ID (PUBLIC)
    // =======================================================
    router.get("/status/:id", async (req, res) => {
        try {
            const orderId = req.params.id;
            const order = await Order.findById(orderId).select('status payment totalAmount items name');

            if (!order) return errorResponse(res, 404, "Pesanan tidak ditemukan");

            res.status(200).json({ 
                success: true, 
                data: {
                    status: order.status,
                    payment: order.payment,
                    totalAmount: order.totalAmount,
                    name: order.name,
                    items: order.items
                }
            });
        } catch (error) {
            console.error("[ERROR] Failed to fetch order status:", error);
            errorResponse(res, 500, "Terjadi kesalahan server");
        }
    });

    // =======================================================
    // GET order by ID
    // =======================================================
    router.get("/:id", authMiddleware, async (req, res) => {
        try {
            const orderId = req.params.id;
            const order = await Order.findById(orderId);

            if (!order) return errorResponse(res, 404, "Pesanan tidak ditemukan");

            if (!req.adminId && order.userId.toString() !== req.userId) {
                return errorResponse(
                    res,
                    403,
                    "Anda tidak memiliki akses ke pesanan ini",
                );
            }

            res.status(200).json({ success: true, data: order });
        } catch (error) {
            console.error("[ERROR] Failed to fetch order:", error);
            errorResponse(res, 500, "Terjadi kesalahan server");
        }
    });

    // =======================================================
    // POST buat order baru (DENGAN LOGIKA DEEP LINK MIDTRANS)
    // =======================================================
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
                voucherId,
                isMobileApp, // Menerima flag dari client
            } = req.body;

            // Validasi Dasar
            if (
                !name ||
                !payment ||
                !method ||
                !items ||
                items.length === 0 ||
                !totalAmount ||
                totalAmount <= 0
            ) {
                return errorResponse(
                    res,
                    400,
                    "Data pesanan tidak lengkap atau tidak valid.",
                );
            }

            // Validasi Metode Makan
            if (
                method === "Makan di Tempat" &&
                (!tableNumber || isNaN(tableNumber) || parseInt(tableNumber) <= 0)
            ) {
                return errorResponse(
                    res,
                    400,
                    "Nomor Meja wajib diisi dan harus berupa angka positif.",
                );
            }
             
            // Validasi Metode Diantar
            if (method === "Diantar") {
                if (!phone || !/^[0-9]{10,15}$/.test(phone)) {
                    return errorResponse(
                        res,
                        400,
                        "Nomor Telepon wajib 10-15 digit angka.",
                    );
                }
                if (!address || address.length < 5) {
                    return errorResponse(res, 400, "Alamat minimal 5 karakter.");
                }
            }

            const user = await User.findById(req.userId);
            if (!user) return errorResponse(res, 404, "Pengguna tidak ditemukan.");
            const userEmail = user.email;

            // Perhitungan Biaya
            const subtotalFromItems = items.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0,
            );
            const serviceFee = Math.round(subtotalFromItems * 0.1);
            const deliveryFee = method === "Diantar" ? 10000 : 0;
            let backendTotal = subtotalFromItems + serviceFee + deliveryFee;

            // Logic Voucher
            let finalDiscount = 0;
            if (voucherId) {
                const voucher = await Voucher.findById(voucherId);
                if (!voucher) {
                    return errorResponse(res, 404, "Voucher tidak ditemukan");
                }

                const now = new Date();
                if (now < voucher.startDate || now > voucher.endDate) {
                    return errorResponse(res, 400, "Voucher tidak berlaku");
                }

                if (subtotalFromItems < voucher.minPurchase) {
                    return errorResponse(
                        res,
                        400,
                        `Minimal belanja Rp ${voucher.minPurchase}`,
                    );
                }

                const startOfDay = new Date(now.setHours(0, 0, 0, 0));
                const endOfDay = new Date(now.setHours(23, 59, 59, 999));
                const usageToday = await VoucherUsage.countDocuments({
                    voucherId,
                    usedAt: { $gte: startOfDay, $lte: endOfDay },
                });

                if (
                    voucher.maxUsagePerDay > 0 &&
                    usageToday >= voucher.maxUsagePerDay
                ) {
                    return errorResponse(res, 400, "Kuota voucher hari ini habis");
                }

                const usageByUser = await VoucherUsage.countDocuments({
                    voucherId,
                    userId: req.userId,
                    usedAt: { $gte: startOfDay, $lte: endOfDay },
                });

                if (
                    voucher.maxUsagePerUser > 0 &&
                    usageByUser >= voucher.maxUsagePerUser
                ) {
                    return errorResponse(
                        res,
                        400,
                        "Kamu sudah menggunakan voucher ini hari ini",
                    );
                }

                if (voucher.discountType === "percent") {
                    finalDiscount = Math.round(
                        (voucher.discountValue / 100) * subtotalFromItems,
                    );
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

            // Buat objek Order baru
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
                status:
                    payment === "Tunai" ? "Menunggu Konfirmasi" : "Menunggu Pembayaran",
                createdAt: moment().tz("Asia/Jakarta").toDate(),
                updatedAt: moment().tz("Asia/Jakarta").toDate(),
            });

            const savedOrder = await newOrder.save();

            // Jika pembayaran Non-Tunai, buat transaksi Midtrans Snap
            if (payment === "Non-Tunai") {
                const midtransItems = items.map((item) => ({
                    id: item._id.toString(),
                    price: Math.round(item.price),
                    quantity: item.quantity,
                    name: item.name,
                }));

                // Tambahkan Fee dan Diskon ke item details Midtrans
                if (serviceFee > 0) {
                    midtransItems.push({
                        id: "service-fee",
                        price: serviceFee,
                        quantity: 1,
                        name: "Biaya Layanan",
                    });
                }
                if (deliveryFee > 0) {
                    midtransItems.push({
                        id: "delivery-fee",
                        price: deliveryFee,
                        quantity: 1,
                        name: "Ongkos Kirim",
                    });
                }
                if (finalDiscount > 0) {
                    midtransItems.push({
                        id: "voucher",
                        price: -finalDiscount, // Diskon harus bernilai negatif di Midtrans item details
                        quantity: 1,
                        name: "Diskon Voucher",
                    });
                }

                const parameter = {
                    transaction_details: {
                        order_id: savedOrder._id.toString(),
                        gross_amount: Math.round(backendTotal),
                    },
                    customer_details: {
                        first_name: name,
                        email: userEmail,
                        phone: phone || user.phone || "081234567890",
                        address: address || user.address || "No Address",
                    },
                    item_details: midtransItems,
                    callbacks: {
                        // LOGIKA PENTING: Pilih callback berdasarkan isMobileApp
                        finish: isMobileApp
                            ? `${DEEP_LINK_SCHEME}://payment/finish?order_id=${savedOrder._id.toString()}`
                            : `${FRONTEND_BASE_URL}/status-pembayaran?order_id=${savedOrder._id.toString()}`,
                         
                        error: isMobileApp
                            ? `${DEEP_LINK_SCHEME}://payment/error?order_id=${savedOrder._id.toString()}`
                            : `${FRONTEND_BASE_URL}/gagal-bayar`,
                         
                        unfinish: isMobileApp
                            ? `${DEEP_LINK_SCHEME}://payment/unfinish?order_id=${savedOrder._id.toString()}`
                            : `${FRONTEND_BASE_URL}/belum-selesai`,
                    },
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
                // Pembayaran Tunai
                return res.status(201).json({
                    success: true,
                    message: "Pesanan berhasil dibuat, menunggu konfirmasi.",
                    order: savedOrder,
                });
            }
        } catch (error) {
            console.error("[ERROR] Failed to create order:", error);
            res
                .status(500)
                .json({
                    success: false,
                    message: "Terjadi kesalahan server.",
                    error: error.message,
                });
        }
    });

    // =======================================================
    // Midtrans Notification Handler (Webhook)
    // =======================================================
    router.post("/midtrans-notification", async (req, res) => {
        try {
            console.log("📥 Midtrans Notification Received:", req.body);

            const notification = req.body;
             
            // Verifikasi signature/status dari Midtrans
            const statusResponse = await coreApi.transaction.notification(notification);
            console.log("✅ Midtrans Status Response:", statusResponse);

            const { order_id, transaction_status, fraud_status, settlement_time } = statusResponse;
             
            const order = await Order.findById(order_id);
            if (!order) {
                console.error("❌ Order not found:", order_id);
                return res.status(404).json({ message: "Order not found" });
            }

            console.log("📦 Current Order Status:", order.status);

            let newStatus;
            let notificationMessage;

            // Mapping status Midtrans ke status order lokal
            if (transaction_status === "capture") {
                if (fraud_status === "accept") {
                    newStatus = "Pembayaran Berhasil";
                    notificationMessage = "Pembayaran Anda telah berhasil!";
                } else {
                    newStatus = "Menunggu Konfirmasi";
                    notificationMessage = "Pembayaran sedang diverifikasi";
                }
            } else if (transaction_status === "settlement") {
                newStatus = "Pembayaran Berhasil";
                notificationMessage = "Pembayaran Anda telah berhasil!";
            } else if (transaction_status === "pending") {
                newStatus = "Menunggu Pembayaran";
                notificationMessage = "Menunggu pembayaran Anda";
            } else if (["cancel", "expire", "deny"].includes(transaction_status)) {
                newStatus = "Pembayaran Dibatalkan";
                notificationMessage = "Pembayaran dibatalkan atau kadaluarsa";
            } else if (["refund", "partial_refund"].includes(transaction_status)) {
                newStatus = "Refunded";
                notificationMessage = "Pembayaran telah dikembalikan";
            } else {
                newStatus = "Unknown";
                notificationMessage = "Status pembayaran tidak diketahui";
            }

            console.log("🔄 New Status:", newStatus);

            // Update status order jika ada perubahan
            if (order.status !== newStatus) {
                order.status = newStatus;
                order.updatedAt = moment().tz("Asia/Jakarta").toDate();
                 
                if (settlement_time) {
                    order.settlementTime = moment(settlement_time).tz("Asia/Jakarta").toDate();
                }
                 
                await order.save();
                console.log("💾 Order status updated successfully");

                // Persiapan notifikasi
                const targetUserId = order.userId.toString();
                let namaPesanan = "Pesanan";

                if (order.items && order.items.length > 0) {
                    namaPesanan = order.items.map(i => i.name || i.title).join(", ");
                }

                const fullNotificationMessage = `${notificationMessage} - Pesanan: ${namaPesanan}`;

                // Simpan notifikasi ke database
                await Notification.create({
                    userId: targetUserId,
                    message: fullNotificationMessage,
                    orderId: order._id,
                });

                // Emit notifikasi real-time via Socket.IO
                io.to(targetUserId).emit("orderStatusUpdate", {
                    orderId: order._id,
                    newStatus: newStatus,
                    message: fullNotificationMessage,
                    namaPesanan: namaPesanan,
                    transactionStatus: transaction_status,
                });

                console.log("📢 Notification sent to user:", targetUserId);
            } else {
                console.log("ℹ️ Status unchanged, skipping update");
            }

            res.status(200).json({ 
                success: true,
                message: "Notification processed successfully",
                order_id: order_id,
                new_status: newStatus
            });
        } catch (error) {
            console.error("❌ [ERROR] Midtrans notification:", error);
            res.status(500).json({
                success: false,
                message: "Error processing notification",
                error: error.message,
            });
        }
    });

    // =======================================================
    // PATCH update order status (Admin Only)
    // =======================================================
    router.patch("/:id", authMiddleware, async (req, res) => {
        try {
            if (!req.adminId) {
                return errorResponse(
                    res,
                    403,
                    "Hanya admin yang bisa mengubah status pesanan",
                );
            }

            const { status: newStatus } = req.body;
            const orderId = req.params.id;

            const order = await Order.findByIdAndUpdate(
                orderId,
                { status: newStatus, updatedAt: moment().tz("Asia/Jakarta").toDate() },
                { new: true },
            ).lean();

            if (!order) return errorResponse(res, 404, "Pesanan tidak ditemukan");

            // Kirim notifikasi ke user via DB dan Socket.IO
            const targetUserId = order.userId.toString();
            let namaPesanan = "Pesanan";

            if (order.items && order.items.length > 0) {
                namaPesanan = order.items.map(i => i.name || i.title).join(", ");
            }

            const notificationMessage = `Status pesanan Anda "${namaPesanan}" telah diperbarui menjadi "${newStatus}"`;

            await Notification.create({
                userId: targetUserId,
                message: notificationMessage,
                orderId: order._id,
            });

            io.to(targetUserId).emit("orderStatusUpdate", {
                orderId: order._id,
                newStatus: newStatus,
                message: notificationMessage,
                namaPesanan: namaPesanan,
            });

            res.status(200).json({
                success: true,
                message: "Status pesanan diperbarui",
                data: order,
            });
        } catch (error) {
            console.error("[ERROR] Update order:", error);
            res.status(500).json({
                success: false,
                message: "Terjadi kesalahan server",
                error: error.message,
            });
        }
    });

    // =======================================================
    // DELETE order (Admin Only)
    // =======================================================
    router.delete("/:id", authMiddleware, async (req, res) => {
        try {
            if (!req.adminId) {
                return errorResponse(res, 403, "Akses ditolak");
            }

            const orderId = req.params.id;
            // Hapus pesanan
            const order = await Order.findOneAndDelete({ _id: orderId });

            if (!order) return errorResponse(res, 404, "Pesanan tidak ditemukan");

            res
                .status(200)
                .json({ success: true, message: "Pesanan berhasil dihapus" });
        } catch (error) {
            console.error("[ERROR] Delete order:", error);
            res
                .status(500)
                .json({
                    success: false,
                    message: "Terjadi kesalahan server",
                    error: error.message,
                });
        }
    });

    return router;
};