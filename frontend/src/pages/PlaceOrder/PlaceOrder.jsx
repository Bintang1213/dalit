import React, { useContext, useState, useEffect } from "react";
import "./PlaceOrder.css";
import { StoreContext } from "../../context/StoreContext";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import moment from "moment-timezone";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PlaceOrder = () => {
  const { cartItems, food_list, getTotalCartAmount, clearCart } =
    useContext(StoreContext);

  const navigate = useNavigate();
  const location = useLocation();
  const method = location.state?.method || "Makan di Tempat";

  const [formData, setFormData] = useState({
    name: "",
    tableNumber: "",
    phone: "",
    address: "",
    note: "",
    payment: "",
  });

  // Voucher states (ditambah untuk UI dropdown & show applied)
  const [voucherList, setVoucherList] = useState([]);
  const [voucherApplied, setVoucherApplied] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [selectedVoucherId, setSelectedVoucherId] = useState("all"); // (dipertahankan kalau backend/pilih manual diperlukan)
  const [showVoucherDropdown, setShowVoucherDropdown] = useState(false); // buka/tutup dropdown
  const [showAllVouchers, setShowAllVouchers] = useState(false); // lihat lainnya expand

  const subtotal = getTotalCartAmount();
  const serviceFee = subtotal * 0.1;
  const deliveryFee = method === "Diantar" ? 10000 : 0;
  const total = subtotal + serviceFee + deliveryFee - discountAmount;

  // Ambil voucher dari backend
  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/vouchers");
        setVoucherList(res.data || []);
      } catch (err) {
        console.error("Gagal fetch voucher:", err);
        toast.error("Tidak bisa mengambil data voucher.");
      }
    };
    fetchVouchers();
  }, [subtotal]);

  // Fungsi bantu: periksa apakah voucher valid sekarang & memenuhi minPurchase & kuota
  const isVoucherUsable = (v) => {
    const now = new Date();
    // jika server mengirimkan tanggal dalam format yang valid
    const start = v.startDate ? new Date(v.startDate) : null;
    const end = v.endDate ? new Date(v.endDate) : null;
    if (start && now < start) return false;
    if (end && now > end) return false;
    if (subtotal < (v.minPurchase || 0)) return false;
    if (v.sisaHariIni !== "Unlimited" && Number(v.sisaHariIni) <= 0)
      return false;
    return true;
  };

  // Terapkan voucher (ke DB + hitung diskon)
  const applyVoucher = async (voucher) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Harus login untuk pakai voucher.");
      return;
    }

    const res = await axios.post(
      "http://localhost:4000/api/vouchers/apply",
      {
        voucherId: voucher._id,
        subtotal: subtotal, // ✅ WAJIB DIKIRIM SEKARANG
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const { discount } = res.data; // ✅ BACKEND BARU NGIRIM LANGSUNG "discount"

    setVoucherApplied(voucher);
    setDiscountAmount(discount);

    setShowVoucherDropdown(false);
    setShowAllVouchers(false);

    toast.success("Voucher berhasil digunakan!");

    // refresh list voucher
    const fresh = await axios.get("http://localhost:4000/api/vouchers");
    setVoucherList(fresh.data || []);

  } catch (err) {
    console.error("Gagal apply voucher:", err);
    toast.error(
      err.response?.data?.message || "Voucher tidak bisa digunakan",
    );
  }
};

  // Input handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Kirim pesanan (logika asli Cece tetap utuh)
  const handleOrder = async (e) => {
    e.preventDefault();

    const nameRegex = /^[A-Za-z\s.,']+$/;
    if (!formData.name || !nameRegex.test(formData.name)) {
      toast.error("Nama hanya boleh huruf, spasi dan karakter.");
      return;
    }

    if (method === "Makan di Tempat") {
      const tableRegex = /^[0-9]+$/;
      if (!formData.tableNumber || !tableRegex.test(formData.tableNumber)) {
        toast.error("Nomor Meja hanya boleh angka.");
        return;
      }
    }

    if (method === "Diantar") {
      const phoneRegex = /^[0-9]{10,15}$/;
      if (!formData.phone || !phoneRegex.test(formData.phone)) {
        toast.error("Nomor Telepon harus angka 10-15 digit.");
        return;
      }
      if (!formData.address || formData.address.trim().length < 5) {
        toast.error("Alamat minimal 5 karakter.");
        return;
      }
    }

    if (!formData.payment) {
      toast.error("Silakan pilih metode pembayaran.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Harus login terlebih dahulu.");
      return;
    }

    const orderedItems = food_list
      .filter((item) => cartItems[item._id] > 0)
      .map((item) => ({
        _id: item._id,
        name: item.name,
        quantity: cartItems[item._id],
        price: item.price,
      }));

    const orderData = {
      ...formData,
      method,
      items: orderedItems,
      subtotal,
      discount: discountAmount,
      totalAmount: total,
      voucherType: voucherApplied ? voucherApplied.discountType : null,
      voucherValue: voucherApplied ? voucherApplied.discountValue : null,
      createdAt: moment().tz("Asia/Jakarta").format(),
    };

    try {
      const response = await axios.post(
        "http://localhost:4000/api/order",
        orderData,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      clearCart();
      toast.success("Pesanan berhasil dibuat!");

      if (formData.payment === "Non-Tunai" && response.data.redirect_url) {
        window.location.href = response.data.redirect_url;
      } else {
        navigate("/struk", { state: { order: orderData } });
      }
    } catch (error) {
      console.error("Gagal mengirim pesanan:", error);
      toast.error("Terjadi kesalahan saat mengirim pesanan.");
    }
  };

  const isFormIncomplete = () => {
    if (!formData.name) return true;
    if (method === "Makan di Tempat" && !formData.tableNumber) return true;
    if (method === "Diantar" && (!formData.phone || !formData.address))
      return true;
    return false;
  };

  // Cepat: usable & displayed vouchers sesuai permintaan Cece
  const usableVouchers = voucherList.filter((v) => isVoucherUsable(v));
  const displayedVouchers = showAllVouchers
    ? usableVouchers
    : usableVouchers.slice(0, 4);

  // Hapus voucher yang sudah dipakai (aksi hapus dari UI)
  const removeAppliedVoucher = () => {
    setVoucherApplied(null);
    setDiscountAmount(0);
  };

  return (
    <div className="place-order-page">
      <ToastContainer />

      <div className="back-button">
        <span className="back-arrow" onClick={() => navigate("/cart")}>
          &larr;
        </span>
        <h2>Kembali</h2>
      </div>

      <form className="place-order" onSubmit={handleOrder}>
        <div className="place-order-left">
          <p className="title">Informasi Pemesanan ({method})</p>

          <input
            type="text"
            placeholder="Nama Lengkap"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />

          {method === "Makan di Tempat" && (
            <input
              type="text"
              placeholder="Nomor Meja"
              name="tableNumber"
              value={formData.tableNumber}
              onChange={handleInputChange}
              required
            />
          )}

          {method === "Diantar" && (
            <>
              <input
                type="text"
                placeholder="Nomor Telepon Aktif"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
              <textarea
                placeholder="Alamat Lengkap"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
              />
            </>
          )}

          <textarea
            placeholder="Catatan untuk pesanan (Opsional)"
            name="note"
            value={formData.note}
            onChange={handleInputChange}
          />

          {/* ---------------- Voucher Section (DIUBAH) ---------------- */}
          <div className="voucher-section">
            {/* Header text jadi "Voucher" */}
            <p className="voucher-title">Voucher</p>

            {/* Box yang selalu terlihat: "Pilih Voucher" */}
            <div
              className="voucher-toggle-box"
              onClick={() => setShowVoucherDropdown((s) => !s)}
            >
              <span className="voucher-toggle-text">Pilih Voucher</span>
              <span className="voucher-toggle-caret">
                {showVoucherDropdown ? "▲" : "▼"}
              </span>
            </div>

            {/* Jika dropdown aktif -> tampilkan kartu voucher (max 4 dulu) */}
            {showVoucherDropdown && (
              <div
                className={`voucher-dropdown ${showAllVouchers ? "expanded" : ""}`}
              >
                <div className="voucher-dropdown-inner">
                  {displayedVouchers.length === 0 ? (
                    <p className="no-voucher-inline">
                      Tidak ada voucher yang dapat digunakan untuk pesanan ini.
                    </p>
                  ) : (
                    displayedVouchers.map((v) => {
                      const isApplied = voucherApplied?._id === v._id;
                      const disabled = !isVoucherUsable(v);

                      return (
                        <div
                          key={v._id}
                          className={`voucher-card ${isApplied ? "applied" : ""} ${disabled ? "disabled" : ""}`}
                        >
                          <div className="voucher-info">
                            <h4 className="voucher-head">
                              {v.discountType === "percent"
                                ? `Diskon ${v.discountValue}%`
                                : `Diskon Rp ${v.discountValue.toLocaleString()}`}
                            </h4>
                            <p className="voucher-min">
                              Min. order Rp {v.minPurchase?.toLocaleString()}
                            </p>
                          </div>

                          <button
                            type="button"
                            className={`voucher-btn ${isApplied ? "applied-btn" : ""}`}
                            onClick={() => {
                              if (!disabled) applyVoucher(v);
                            }}
                            disabled={disabled}
                          >
                            {isApplied ? "Dipakai" : "Pakai"}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* tombol "Lihat Lainnya" (tetap di dropdown) */}
                {usableVouchers.length > 4 && (
                  <div className="voucher-dropdown-footer">
                    <button
                      type="button"
                      className="voucher-see-more"
                      onClick={() => setShowAllVouchers((s) => !s)}
                    >
                      {showAllVouchers ? "Tutup" : "Lihat Lainnya ⌄"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Jika ada voucherApplied -> tampilkan di luar dropdown seperti permintaan */}
            {voucherApplied && (
              <div className="applied-voucher-box">
                <div className="voucher-card applied">
                  <div className="voucher-info">
                    <h4 className="voucher-head">
                      {voucherApplied.discountType === "percent"
                        ? `Diskon ${voucherApplied.discountValue}%`
                        : `Diskon Rp ${voucherApplied.discountValue.toLocaleString()}`}
                    </h4>
                    <p className="voucher-min">
                      Min. order Rp {voucherApplied.minPurchase?.toLocaleString()}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className="voucher-applied-label">Dipakai ✅</span>
                  </div>
                  </div>
                  </div>
                  )}
                  </div>
                  {/* ---------------- end voucher section ---------------- */}
                  </div>

        {/* KANAN (tidak diubah) */}
        <div className="place-order-right">
          <h2 className="title">Ringkasan Pemesanan</h2>
          <hr className="summary-line" />

          {food_list.map(
            (item) =>
              cartItems[item._id] > 0 && (
                <div className="summary-line" key={item._id}>
                  <p>{item.name}</p>
                  <div>x{cartItems[item._id]}</div>
                  <p>
                    Rp. {(item.price * cartItems[item._id]).toLocaleString()}
                  </p>
                </div>
              ),
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

          {voucherApplied && (
            <div className="summary-line discount">
              <p>
                Diskon Voucher{" "}
                {voucherApplied.discountType === "percent"
                  ? `${voucherApplied.discountValue}%`
                  : `Rp ${voucherApplied.discountValue.toLocaleString()}`}
              </p>
              <p>- Rp. {discountAmount.toLocaleString()}</p>
            </div>
          )}

          <hr />
          <div className="summary-total">
            <b>Total</b>
            <b>Rp. {total.toLocaleString()}</b>
          </div>

          <p className="payment-label">Pilih Metode Pembayaran</p>
          <div className="radio-options">
            <input
              type="radio"
              id="tunai"
              name="payment"
              value="Tunai"
              checked={formData.payment === "Tunai"}
              onChange={handleInputChange}
            />
            <label htmlFor="tunai">Tunai</label>

            <input
              type="radio"
              id="nontunai"
              name="payment"
              value="Non-Tunai"
              checked={formData.payment === "Non-Tunai"}
              onChange={handleInputChange}
            />
            <label htmlFor="nontunai">Non-Tunai</label>
          </div>

          <button
            type="submit"
            className="order-button"
            disabled={isFormIncomplete()}
          >
            Pesan
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlaceOrder;
