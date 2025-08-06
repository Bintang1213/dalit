import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Midtrans.css';

const Midtrans = () => {
  const navigate = useNavigate();

  const handlePaymentComplete = () => {
    // Arahkan ke halaman struk tanpa mengirim data apapun
    navigate('/struk');
  };

  return (
    <div className="midtrans-page">
      <h2>Simulasi Pembayaran Non-Tunai (Midtrans)</h2>
      <button className="btn-bayar" onClick={handlePaymentComplete}>
        Bayar Sekarang
      </button>
    </div>
  );
};

export default Midtrans;
