import express from 'express';
import Order from '../models/order.js';
import User from '../models/userModel.js'; // <-- PENTING: Pastikan path ini benar ke model User Anda
import authMiddleware from '../middleware/auth.js';
import snap from '../config/midtrans.js'; // Pastikan ini mengarah ke file konfigurasi Midtrans Anda
import moment from 'moment-timezone'; // Pastikan moment-timezone terinstal (npm install moment-timezone)
import midtransClient from 'midtrans-client'; // Tambahkan ini untuk verifikasi notifikasi

const router = express.Router();

// Helper function untuk response error yang konsisten
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


router.get("/", authMiddleware, async (req, res) => {
    try {
        if (!req.adminId) {
            console.log("Access denied - Not admin");
            return errorResponse(res, 403, "Hanya admin yang bisa mengakses daftar pesanan");
        }

        const orders = await Order.find().sort({
            createdAt: -1
        });
        console.log(`Admin accessed all orders. Found ${orders.length} orders`);

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        console.error("Failed to fetch orders:", error);
        errorResponse(res, 500, "Terjadi kesalahan server");
    }
});


router.get("/user", authMiddleware, async (req, res) => {
    try {
        if (!req.userId) {
            console.log("No user ID found");
            return errorResponse(res, 403, "Akses ditolak");
        }

        const orders = await Order.find({
            userId: req.userId
        }).sort({
            createdAt: -1
        });
        console.log(`User ${req.userId} accessed their orders. Found ${orders.length} orders`);

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        console.error("Failed to fetch user orders:", error);
        errorResponse(res, 500, "Terjadi kesalahan server");
    }
});

router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId);

        if (!order) {
            console.log("Order not found:", orderId);
            return errorResponse(res, 404, "Pesanan tidak ditemukan");
        }

        // Cek apakah user adalah admin atau pemilik order
        if (!req.adminId && order.userId.toString() !== req.userId) {
            console.log(`User ${req.userId} unauthorized to access order ${orderId}`);
            return errorResponse(res, 403, "Anda tidak memiliki akses ke pesanan ini");
        }

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error("Failed to fetch order:", error);
        errorResponse(res, 500, "Terjadi kesalahan server");
    }
});




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
            totalAmount
        } = req.body;

        if (!name || !payment || !method || !items || items.length === 0 || !totalAmount || totalAmount <= 0) {
            return errorResponse(res, 400, "Data pesanan tidak lengkap atau tidak valid.");
        }

        if (method === "Makan di Tempat" && (!tableNumber || isNaN(tableNumber) || parseInt(tableNumber) <= 0)) {
            return errorResponse(res, 400, "Nomor Meja wajib diisi dan harus berupa angka positif untuk metode 'Makan di Tempat'.");
        }
        if (method === "Diantar") {
            if (!phone || !/^\d{10,15}$/.test(phone)) {
                return errorResponse(res, 400, "Nomor Telepon wajib diisi dan harus antara 10-15 digit angka untuk metode 'Diantar'.");
            }
            if (!address || address.length < 5) {
                return errorResponse(res, 400, "Alamat wajib diisi dengan minimal 5 karakter untuk metode 'Diantar'.");
            }
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return errorResponse(res, 404, "Pengguna tidak ditemukan.");
        }
        const userEmail = user.email;

        const subtotalFromItems = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const serviceFee = Math.round(subtotalFromItems * 0.1);
        const deliveryFee = method === "Diantar" ? 10000 : 0;

        const backendCalculatedTotal = subtotalFromItems + serviceFee + deliveryFee;
        if (Math.round(backendCalculatedTotal) !== Math.round(totalAmount)) {
            console.warn(`[WARNING] Total Amount Mismatch! Frontend sent: ${totalAmount}, Backend calculated: ${backendCalculatedTotal}`);
        }

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
            totalAmount,
            serviceFee: serviceFee,
            deliveryFee: deliveryFee,
            status: payment === "Tunai" ? "Menunggu Konfirmasi" : "Menunggu Pembayaran",
            createdAt: moment().tz('Asia/Jakarta').toDate(),
            updatedAt: moment().tz('Asia/Jakarta').toDate(),
        });

        const savedOrder = await newOrder.save();
        console.log("New order created and saved to DB:", savedOrder._id);

        if (payment === "Non-Tunai") {
            const midtransItems = items.map(item => ({
                id: item._id.toString(),
                price: Math.round(item.price),
                quantity: item.quantity,
                name: item.name,
            }));

            if (serviceFee > 0) {
                midtransItems.push({
                    id: 'service-fee',
                    price: serviceFee,
                    quantity: 1,
                    name: 'Biaya Layanan',
                });
            }
            if (deliveryFee > 0) {
                midtransItems.push({
                    id: 'delivery-fee',
                    price: deliveryFee,
                    quantity: 1,
                    name: 'Ongkos Kirim',
                });
            }

            const parameter = {
                transaction_details: {
                    order_id: savedOrder._id.toString(),
                    gross_amount: Math.round(totalAmount),
                },
                customer_details: {
                    first_name: name,
                    email: userEmail,
                    phone: phone || user.phone || '081234567890',
                    address: address || user.address || 'No Address',
                },
                item_details: midtransItems,
                callbacks: {
                    finish: 'https://your-domain.com/api/midtrans/finish', 
                    error: 'https://your-domain.com/api/midtrans/error',   
                    unfinish: 'https://your-domain.com/api/midtrans/unfinish', 
                }
            };

            const transaction = await snap.createTransaction(parameter);
            console.log("Midtrans transaction created:", transaction.token);

            savedOrder.midtransToken = transaction.token;
            savedOrder.midtransRedirectUrl = transaction.redirect_url;
            await savedOrder.save();

            res.status(201).json({
                success: true,
                message: "Pesanan berhasil dibuat, menanti pembayaran.",
                order: savedOrder,
                token: transaction.token,
                redirect_url: transaction.redirect_url,
            });
        } else {
            res.status(201).json({
                success: true,
                message: "Pesanan berhasil dibuat, menunggu konfirmasi pembayaran tunai.",
                order: savedOrder,
            });
        }

    } catch (error) {
        console.error("Failed to create order:", error);
        if (error.ApiResponse) {
            console.error("Midtrans API response error:", error.ApiResponse);
            return res.status(error.httpStatusCode || 500).json({
                success: false,
                message: error.ApiResponse.error_messages ? error.ApiResponse.error_messages.join(', ') : "Gagal membuat transaksi Midtrans. (Detail error dari Midtrans)",
                error: error.message,
                midtransError: error.ApiResponse
            });
        }
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server saat membuat pesanan.",
            error: error.message
        });
    }
});

router.post("/midtrans-notification", async (req, res) => {
    try {
        const notification = req.body;
        let orderId = notification.order_id;
        let transactionStatus = notification.transaction_status;
        let fraudStatus = notification.fraud_status;

        console.log(`[Midtrans Notification] Received for Order ID: ${orderId}`);
        console.log(`[Midtrans Notification] Status: ${transactionStatus}, Fraud: ${fraudStatus}`);

        // Verifikasi Signature Key (Sangat Penting untuk Keamanan)
        // Ini memastikan notifikasi benar-benar dari Midtrans
        const statusResponse = await coreApi.transaction.notification(notification);

        // Perbarui variabel dengan data hasil verifikasi
        transactionStatus = statusResponse.transaction_status;
        orderId = statusResponse.order_id;
        fraudStatus = statusResponse.fraud_status;

        const order = await Order.findById(orderId);
        if (!order) {
            console.log(`[Midtrans Notification] Order with ID ${orderId} not found in DB.`);
            return res.status(404).json({
                message: "Order not found"
            });
        }

        let newOrderStatus;
        if (transactionStatus == 'capture') {
            if (fraudStatus == 'challenge') {
                newOrderStatus = 'Challenged';
            } else if (fraudStatus == 'accept') {
                newOrderStatus = 'Pembayaran Berhasil';
            }
        } else if (transactionStatus == 'settlement') {
            newOrderStatus = 'Pembayaran Berhasil';
        } else if (transactionStatus == 'pending') {
            newOrderStatus = 'Menunggu Pembayaran';
        } else if (transactionStatus == 'cancel' || transactionStatus == 'expire' || transactionStatus == 'deny') {
            newOrderStatus = 'Pembayaran Dibatalkan';
        } else if (transactionStatus == 'refund' || transactionStatus == 'partial_refund') {
            newOrderStatus = 'Refunded';
        } else {
            newOrderStatus = 'Unknown';
        }

        if (order.status !== newOrderStatus) {
            order.status = newOrderStatus;
            order.updatedAt = moment().tz('Asia/Jakarta').toDate();
            await order.save();
            console.log(`[Midtrans Notification] Order ${orderId} status updated to: ${newOrderStatus}`);
        } else {
            console.log(`[Midtrans Notification] Order ${orderId} status is already ${newOrderStatus}. No update needed.`);
        }

        res.status(200).json({
            message: "Notification received and order status processed"
        });

    } catch (error) {
        console.error("Error processing Midtrans notification:", error);
        res.status(500).json({
            message: "Error processing notification",
            error: error.message
        });
    }
});


// ===============================================
//           ROUTES UNTUK MENGELOLA PESANAN (lanjutan)
// ===============================================

// 5. Update order status
router.patch("/:id", authMiddleware, async (req, res) => {
    try {
        const {
            status
        } = req.body;
        const orderId = req.params.id;
        console.log(`Updating order ${orderId} to status: ${status}`);

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status tidak valid"
            });
        }

        const order = await Order.findByIdAndUpdate(
            orderId, {
                status,
                updatedAt: moment().tz('Asia/Jakarta').toDate()
            }, {
                new: true
            }
        );

        if (!order) {
            console.log("Order not found for update:", orderId);
            return res.status(404).json({
                success: false,
                message: "Pesanan tidak ditemukan"
            });
        }

        console.log("Order status updated:", order._id);
        res.status(200).json({
            success: true,
            message: "Status pesanan diperbarui",
            data: order
        });
    } catch (error) {
        console.error("Failed to update order:", error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server",
            error: error.message
        });
    }
});

// 6. Delete order
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const orderId = req.params.id;
        console.log("Deleting order:", orderId);

        const order = await Order.findOneAndDelete({
            _id: orderId
        });
        if (!order) {
            console.log("Order not found for deletion:", orderId);
            return res.status(404).json({
                success: false,
                message: "Pesanan tidak ditemukan"
            });
        }

        console.log("Order deleted:", orderId);
        res.status(200).json({
            success: true,
            message: "Pesanan berhasil dihapus"
        });
    } catch (error) {
        console.error("Failed to delete order:", error);
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server",
            error: error.message
        });
    }
});

export default router;