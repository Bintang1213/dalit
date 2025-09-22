import mongoose from 'mongoose';
import moment from 'moment-timezone';

const getLocalDate = () => {
  return moment.tz('Asia/Jakarta').toDate();
};

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  name: { type: String, required: true },
  tableNumber: { type: String },
  phone: { type: String },
  address: { type: String },
  note: { type: String },
  payment: { type: String, required: true },
  method: { type: String, required: true },
  items: [{
    _id: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
  }],
  totalAmount: { type: Number, required: true },
  serviceFee: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  status: { type: String, default: 'menunggu' },
  midtransToken: { type: String },
  midtransRedirectUrl: { type: String },
  reviewed: { type: Boolean, default: false }, // ✅ tambahin field ini
  createdAt: { type: Date, default: getLocalDate },
  updatedAt: { type: Date, default: getLocalDate },
});

// Anda menggunakan "Order" sebagai nama model, pastikan konsisten
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;