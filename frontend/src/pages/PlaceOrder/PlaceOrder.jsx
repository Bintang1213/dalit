import React, { useContext, useState } from 'react';
import './PlaceOrder.css';
import { StoreContext } from '../../context/StoreContext';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment-timezone';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PlaceOrder = () => {
  const {
    cartItems,
    food_list,
    getTotalCartAmount,
    clearCart,
  } = useContext(StoreContext);

  const navigate = useNavigate();
  const location = useLocation();
  const method = location.state?.method || "Makan di Tempat";

  const [formData, setFormData] = useState({
    name: '',
    tableNumber: '',
    phone: '',
    address: '',
    note: '',
    payment: ''
  });

  const subtotal = getTotalCartAmount();
  const serviceFee = subtotal * 0.1;
  const deliveryFee = method === "Diantar" ? 10000 : 0;
  const total = subtotal + serviceFee + deliveryFee;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOrder = async (e) => {
    e.preventDefault();

    const nameRegex = /^[A-Za-z\s.,']+$/;
    if (!formData.name || !nameRegex.test(formData.name)) {
      toast.error("Nama hanya boleh huruf, spasi dan karakter.", { style: { background: 'white', color: 'black', fontWeight: 'bold' } });
      return;
    }

    if (method === "Makan di Tempat") {
      const tableRegex = /^[0-9]+$/;
      if (!formData.tableNumber || !tableRegex.test(formData.tableNumber)) {
        toast.error("Nomor Meja hanya boleh angka.", { style: { background: 'white', color: 'black', fontWeight: 'bold' } });
        return;
      }
    }

    if (method === "Diantar") {
      const phoneRegex = /^[0-9]{10,15}$/;
      if (!formData.phone || !phoneRegex.test(formData.phone)) {
        toast.error("Nomor Telepon harus angka 10-15 digit.", { style: { background: 'white', color: 'black', fontWeight: 'bold' } });
        return;
      }
      if (!formData.address || formData.address.trim().length < 5) {
        toast.error("Alamat minimal 5 karakter.", { style: { background: 'white', color: 'black', fontWeight: 'bold' } });
        return;
      }
    }

    if (!formData.payment) {
      toast.error("Pilih metode pembayaran.", { style: { background: 'white', color: 'black', fontWeight: 'bold' } });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("Harus login terlebih dahulu.", { style: { background: 'white', color: 'black', fontWeight: 'bold' } });
      return;
    }

    const orderedItems = food_list
      .filter(item => cartItems[item._id] > 0)
      .map(item => ({
        _id: item._id,
        name: item.name,
        quantity: cartItems[item._id],
        price: item.price
      }));

    const orderData = {
      ...formData,
      method,
      items: orderedItems,
      totalAmount: total,
      createdAt: moment().tz('Asia/Jakarta').format()
    };

    try {
      const response = await axios.post('http://localhost:4000/api/order', orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      clearCart();

      toast.success("Pesanan berhasil dibuat!", { style: { background: 'white', color: 'black', fontWeight: 'bold' } });

      if (formData.payment === "Non-Tunai" && response.data.redirect_url) {
        window.location.href = response.data.redirect_url;
      } else {
        navigate('/struk', { state: { order: response.data.order } });
      }

    } catch (error) {
      console.error('Gagal mengirim pesanan:', error);
      toast.error('Terjadi kesalahan saat mengirim pesanan.', { style: { background: 'white', color: 'black', fontWeight: 'bold' } });
    }
  };

  const isFormIncomplete = () => {
    if (!formData.name || !formData.payment) return true;
    if (method === "Makan di Tempat" && !formData.tableNumber) return true;
    if (method === "Diantar" && (!formData.phone || !formData.address)) return true;
    return false;
  };

  return (
    <div className="place-order-page">
      <ToastContainer position="top-center" />
      <div className="back-button">
        <span className="back-arrow" onClick={() => navigate("/cart")}>&larr;</span>
        <h2>Kembali</h2>
      </div>

      <form className='place-order' onSubmit={handleOrder}>
        <div className="place-order-left">
          <p className="title">Informasi Pemesanan ({method})</p>

          <input type="text" placeholder="Nama Lengkap" name="name" value={formData.name} onChange={handleInputChange} required />

          {method === "Makan di Tempat" && (
            <input type="text" placeholder="Nomor Meja" name="tableNumber" value={formData.tableNumber} onChange={handleInputChange} required />
          )}

          {method === "Diantar" && (
            <>
              <input type="text" placeholder="Nomor Telepon Aktif" name="phone" value={formData.phone} onChange={handleInputChange} required />
              <textarea placeholder="Alamat Lengkap" name="address" value={formData.address} onChange={handleInputChange} required />
            </>
          )}

          <textarea placeholder="Catatan untuk pesanan (Opsional)" name="note" value={formData.note} onChange={handleInputChange} />
        </div>

        <div className="place-order-right">
          <h2 className='title'>Ringkasan Pemesanan</h2>
          <hr className="summary-line" />

          {food_list.map((item) =>
            cartItems[item._id] > 0 && (
              <div className="summary-line" key={item._id}>
                <p>{item.name}</p>
                <div>x{cartItems[item._id]}</div>
                <p>Rp. {(item.price * cartItems[item._id]).toLocaleString()}</p>
              </div>
            )
          )}

          <div className="summary-line">
            <p>Biaya Layanan 10%</p>
            <p>Rp. {serviceFee.toLocaleString()}</p>
          </div>

          {method === "Diantar" && (
            <div className="summary-line">
              <p>Ongkos Kirim</p>
              <p>Rp. {deliveryFee.toLocaleString()}</p>
            </div>
          )}

          <hr />
          <div className="summary-total">
            <b>Total</b>
            <b>Rp. {total.toLocaleString()}</b>
          </div>

          <p className='payment-label'>Pilih Metode Pembayaran</p>
          <div className="radio-options">
            <input type="radio" id="tunai" name="payment" value="Tunai" checked={formData.payment === "Tunai"} onChange={handleInputChange} />
            <label htmlFor="tunai">Tunai</label>

            <input type="radio" id="nontunai" name="payment" value="Non-Tunai" checked={formData.payment === "Non-Tunai"} onChange={handleInputChange} />
            <label htmlFor="nontunai">Non-Tunai</label>
          </div>

          <button type="submit" className="order-button" disabled={isFormIncomplete()}>
            Pesan
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlaceOrder;
