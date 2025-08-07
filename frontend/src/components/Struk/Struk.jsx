import React from 'react';
import './Struk.css';
import { useNavigate, useLocation } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { FiDownload } from 'react-icons/fi';
import moment from 'moment';

const Struk = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const order = location.state?.order;

  const handleDownload = () => {
    const strukElement = document.getElementById('struk-download');

    // Sembunyikan tombol sebelum ambil screenshot
    const buttons = strukElement.querySelector('.btn-actions');
    if (buttons) buttons.style.display = 'none';

    html2canvas(strukElement).then((canvas) => {
      const link = document.createElement('a');
      link.download = 'struk-kedai-wartiyem.png';
      link.href = canvas.toDataURL();
      link.click();

      // Tampilkan kembali tombol setelah unduh
      if (buttons) buttons.style.display = 'flex';
    });
  };

  if (!order) {
    return (
      <div className="struk-wrapper">
        <div className="struk-box">
          <p>Data struk tidak ditemukan.</p>
          <button onClick={() => navigate('/')}>Kembali ke Beranda</button>
        </div>
      </div>
    );
  }

  const subtotal = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const serviceFee = subtotal * 0.1;
  const deliveryFee = order.method === "Diantar" ? 10000 : 0;
  const total = subtotal + serviceFee + deliveryFee;
  const totalQty = order.items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="struk-wrapper">
      <div className="struk-box" id="struk-download">
        <div className="title">KEDAI WARTIYEM</div>
        <div className="alamat">
          Jl. Ampera No.57, Rt/Rw 002/023 Bulak, Kec. Jatibarang,<br />
          Kabupaten Indramayu, Jawa Barat 45273<br />
          No.Telp: 0813955878510
        </div>

        <hr />

        <div className="tanggal-jam">
          <div>{moment(order.createdAt).format('DD-MM-YYYY')}</div>
          <div>{moment(order.createdAt).format('HH:mm')} WIB</div>
        </div>
        <div className="tanggal-jam">
          <div>Kode Pesanan</div>
          <div>{order._id?.slice(-6).toUpperCase()}</div>
        </div>

        <hr />

        <div className="pelanggan">
          <div className="bold-item">{order.name}</div>
          {order.phone && <div>{order.phone}</div>}
          {order.address && (
            <div>
              <span className="bold-item">Alamat Lengkap</span>: {order.address}
            </div>
          )}
        </div>

        <hr />

        <div className="list-pesanan">
          {order.items.map((item, idx) => (
            <div className="item bold-item" key={idx}>
              <span>{item.name}</span>
              <span className="jumlah">x{item.quantity}</span>
              <span className="harga">Rp. {(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
        </div>

        <hr />

        <div className="rangkuman">
          <div className="item"><span>Total QTY : {totalQty}</span></div>
          <div className="item"><span>Subtotal</span><span>Rp. {subtotal.toLocaleString()}</span></div>
          <div className="item"><span>Biaya Layanan (10%)</span><span>Rp. {serviceFee.toLocaleString()}</span></div>
          {deliveryFee > 0 && (
            <div className="item"><span>Ongkos Kirim</span><span>Rp. {deliveryFee.toLocaleString()}</span></div>
          )}
          <div className="item total"><span>TOTAL</span><span>Rp. {total.toLocaleString()}</span></div>
        </div>

        <hr />

        <div className="pembayaran">
          <div className="item"><span>Metode Pemesanan</span><span>{order.method}</span></div>
          <div className="item"><span>{order.payment}</span><span>Rp. {total.toLocaleString()}</span></div>
        </div>

        {order.note && (
          <div className="catatan">
            <span className="bold-item">Catatan Pesanan:</span><br />
            <em>{order.note}</em>
          </div>
        )}

        <div className="terima-kasih">Terima kasih atas transaksi Anda</div>

        <div className="btn-actions">
          <button className="btn-red" onClick={handleDownload}>
            <FiDownload size={16} style={{ marginRight: '6px' }} />
            Unduh Struk
          </button>
          <button className="btn-red" onClick={() => navigate("/riwayat")}>
            Lihat Riwayat Pesanan
          </button>
        </div>
      </div>
    </div>
  );
};

export default Struk;
