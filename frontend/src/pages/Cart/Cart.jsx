import React, { useContext, useState } from "react";
import "./Cart.css";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import LoginPopup from "../../components/LoginPopup/LoginPopup";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Cart = () => {
  const {
    cartItems,
    food_list,
    removeFromCart,
    getTotalCartAmount,
    url,
    token,
  } = useContext(StoreContext);

  const [orderMethod, setOrderMethod] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleConfirm = () => {
    if (!orderMethod) {
      toast.warning("Silakan pilih metode pemesanan terlebih dahulu.", {
        style: {
          background: "white",
          color: "black",
          zIndex: 99999,
        },
        autoClose: 2000,
      });
      return;
    }

    if (!token) {
      toast.error("Silakan login terlebih dahulu.", {
        style: {
          background: "white",
          color: "black",
          fontWeight: "bold",
          zIndex: 99999,
        },
        autoClose: 2000,
      });

      // delay popup supaya toast terlihat dulu
      setTimeout(() => {
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
          setShowLogin(true);
        }, 500);
      }, 100);

      return;
    }

    navigate("/order", { state: { method: orderMethod } });
  };

  // 🔹 Handler hapus dengan konfirmasi pakai toast (hapus semua qty)
  const handleRemove = (id, name) => {
    toast(
      ({ closeToast }) => (
        <div style={{ textAlign: "center" }}>
          <p>
            Apakah Anda yakin ingin menghapus
            <br /> <b>"{name}"</b> dari keranjang?
          </p>
          <div
            style={{
              marginTop: "10px",
              display: "flex",
              gap: "10px",
              justifyContent: "center",
            }}
          >
            <button
              onClick={() => {
                const qty = cartItems[id] || 0;
                // panggil removeFromCart sebanyak qty agar item benar-benar habis
                for (let i = 0; i < qty; i++) {
                  removeFromCart(id);
                }
                toast.success(`"${name}" Berhasil dihapus dari keranjang.`, {
                  style: { background: "white", color: "black" },
                  autoClose: 2000,
                });
                closeToast();
              }}
              style={{
                padding: "5px 12px",
                background: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Ya
            </button>
            <button
              onClick={closeToast}
              style={{
                padding: "5px 12px",
                background: "gray",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Batal
            </button>
          </div>
        </div>
      ),
      {
        style: {
          background: "white",
          color: "black",
          zIndex: 99999,
        },
        autoClose: false, // tunggu pilihan user
        closeOnClick: false,
      }
    );
  };

  return (
    <div className="cart">
      {/* 🔹 ToastContainer fix: pojok kanan atas dan di atas popup */}
      <ToastContainer
        position="top-right"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        style={{ zIndex: 99999 }}
      />

      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}
      {showLogin && <LoginPopup setShowLogin={setShowLogin} />}

      <div className="back-button">
        <span className="back-arrow" onClick={() => navigate("/")}>
          &larr;
        </span>
        <h2>Keranjang</h2>
      </div>

      <div className="cart-items">
        <div className="cart-items-title">
          <p>Menu</p>
          <p>Deskripsi</p>
          <p>Harga</p>
          <p>Jumlah</p>
          <p>Total</p>
          <p>Hapus</p>
        </div>
        <br />
        <hr />
        {food_list.map((item) => {
          if (cartItems[item._id] > 0) {
            return (
              <div key={item._id}>
                <div className="cart-items-title cart-items-item">
                  <img
                    src={url + "/images/" + item.image}
                    alt={item.name}
                    onError={(e) => (e.target.src = url + "/images/default.png")}
                  />
                  <p>{item.name}</p>
                  <p>{item.price}</p>
                  <p>{cartItems[item._id]}</p>
                  <p>Rp{item.price * cartItems[item._id]}</p>
                  <p
                    onClick={() => handleRemove(item._id, item.name)}
                    className="cross"
                    style={{ cursor: "pointer" }}
                  >
                    <i className="bi bi-trash"></i>
                  </p>
                </div>
                <hr />
              </div>
            );
          }
          return null;
        })}
      </div>

      <div className="cart-bottom">
        <div className="cart-options">
          <h3>Pilih Metode Pemesanan</h3>
          <div className="radio-options">
            <input
              type="radio"
              id="ditempat"
              name="metode"
              value="Makan di Tempat"
              checked={orderMethod === "Makan di Tempat"}
              onChange={(e) => setOrderMethod(e.target.value)}
            />
            <label htmlFor="ditempat">Makan di Tempat</label>

            <input
              type="radio"
              id="bungkus"
              name="metode"
              value="Bungkus"
              checked={orderMethod === "Bungkus"}
              onChange={(e) => setOrderMethod(e.target.value)}
            />
            <label htmlFor="bungkus">Bungkus</label>

            <input
              type="radio"
              id="diantar"
              name="metode"
              value="Diantar"
              checked={orderMethod === "Diantar"}
              onChange={(e) => setOrderMethod(e.target.value)}
            />
            <label htmlFor="diantar">Diantar</label>
          </div>

          <div className="cart-summary-row">
            <div className="cart-summary">
              <p>Subtotal</p>
              <h3>Rp. {getTotalCartAmount().toLocaleString()}</h3>
            </div>

            <button className="confirm-btn" onClick={handleConfirm}>
              Konfirmasi Pesanan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
