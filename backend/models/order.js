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
  // Lebih spesifik untuk item_details agar konsisten dengan apa yang dikirim ke Midtrans
  items: [{
    _id: { type: String, required: true }, // ID produk
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
  }],
  totalAmount: { type: Number, required: true },
  // BARU: Tambahkan field untuk menyimpan biaya layanan dan ongkos kirim
  serviceFee: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  status: { type: String, default: 'menunggu' }, // Sesuaikan default jika diperlukan, contoh: 'pending'
  // BARU: Tambahkan field untuk menyimpan data Midtrans
  midtransToken: { type: String },
  midtransRedirectUrl: { type: String },
  createdAt: { type: Date, default: getLocalDate },
  // BARU: Tambahkan field updatedAt jika Anda ingin melacak kapan order terakhir diperbarui
  updatedAt: { type: Date, default: getLocalDate },
});

// Anda menggunakan "Order" sebagai nama model, pastikan konsisten
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;