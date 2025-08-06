// backend/routes/notification.js
import express from 'express';
import Order from '../models/order.js';
import { coreApi } from '../config/midtrans.js';
import shajs from 'sha.js';

const router = express.Router();

router.post('/api/notification', async (req, res) => {
  try {
    const notificationJson = req.body;
    const signatureKey = notificationJson.signature_key;

    const calculatedSignature = shajs('sha512').update(JSON.stringify(notificationJson) + coreApi.apiConfig.serverKey).digest('hex');

    if (signatureKey !== calculatedSignature) {
      console.log('Invalid signature!');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const orderId = notificationJson.order_id;
    const transactionStatus = notificationJson.transaction_status;
    const fraudStatus = notificationJson.fraud_status;

    console.log(`Transaction notification received. Order ID: ${orderId}. Status: ${transactionStatus}. Fraud: ${fraudStatus}`);

    if (transactionStatus === 'capture' && fraudStatus === 'accept') {
      await Order.findByIdAndUpdate(orderId, { status: 'dibayar' });
    } else if (transactionStatus === 'settlement') {
      await Order.findByIdAndUpdate(orderId, { status: 'dibayar' });
    } else if (transactionStatus === 'pending') {
      await Order.findByIdAndUpdate(orderId, { status: 'menunggu_konfirmasi' });
    } else if (
      transactionStatus === 'deny' ||
      transactionStatus === 'expire' ||
      transactionStatus === 'cancel'
    ) {
      await Order.findByIdAndUpdate(orderId, { status: 'gagal_bayar' });
    } else if (transactionStatus === 'refund') {
      await Order.findByIdAndUpdate(orderId, { status: 'dana_dikembalikan' });
    }

    res.status(200).json({ message: 'Notification received' });
  } catch (error) {
    console.error('Error processing notification:', error);
    res.status(500).json({ error: 'Gagal memproses notifikasi' });
  }
});

export default router;