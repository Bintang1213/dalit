import React, { useContext, useState, useEffect, useRef } from "react";
import "./Navbar.css";
import { assets } from "../../assets/assets";
import { Link, useNavigate } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";
import io from "socket.io-client";
import {
  getNotificationCount,
  markAllAsRead,
  fetchNotifications,
} from "../../api/notificationApi";

const SERVER_URL = "http://localhost:4000";
let socket = null;

const Navbar = ({ setShowLogin }) => {
  const [menu, setMenu] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCartDropdown, setShowCartDropdown] = useState(false);

  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationDropdown, setShowNotificationDropdown] =
    useState(false);
  const [notifications, setNotifications] = useState([]);

  const {
    getTotalCartAmount,
    getTotalCartItems,
    token,
    setToken,
    user,
    cartItems,
  } = useContext(StoreContext);

  const profileDropdownRef = useRef();
  const menuRef = useRef();
  const notificationRef = useRef();
  const cartRef = useRef();

  const navigate = useNavigate();

  const handleSearch = () => {
    if (searchQuery.trim() !== "") {
      navigate(`/menu?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    } else {
      toast.info("Ketik dulu kata kunci pencarian!", {
        position: "top-center",
        autoClose: 2000,
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    toast.success("Anda berhasil logout", {
      style: { background: "white", color: "black" },
    });
    setTimeout(() => {
      setShowLogin(true);
    }, 300);
  };

  const handleMarkAllRead = async () => {
    if (unreadCount > 0) {
      try {
        await markAllAsRead(token);
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        toast.success("Semua notifikasi ditandai sudah dibaca");
      } catch (error) {
        toast.error("Gagal menandai sudah dibaca");
      }
    }
    setShowNotificationDropdown(false);
  };

  const loadNotifications = async () => {
    if (token) {
      try {
        const data = await fetchNotifications(token);
        setNotifications(data);

        const count = data.filter((n) => !n.isRead).length;
        setUnreadCount(count);
      } catch (error) {
        console.error("Gagal memuat daftar notifikasi:", error);
      }
    }
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Fungsi untuk mendapatkan item cart yang unik untuk preview
  const getCartPreviewItems = () => {
    const items = [];
    Object.keys(cartItems).forEach((itemId) => {
      if (cartItems[itemId] > 0) {
        // Simulasi data item - Anda perlu menyesuaikan dengan struktur data Anda
        items.push({
          id: itemId,
          name: `Item ${itemId}`,
          price: 25000,
          quantity: cartItems[itemId],
          image: assets.w, // Ganti dengan gambar yang sesuai
        });
      }
    });
    return items.slice(0, 3); // Tampilkan maksimal 3 item di preview
  };

  useEffect(() => {
    if (token) {
      loadNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }

    if (token && !socket) {
      socket = io(SERVER_URL, {
        auth: { token: token },
        transports: ["websocket", "polling"],
      });

      socket.on("orderStatusUpdate", (data) => {
        toast.info(data.message, { position: "top-right", autoClose: 5000 });

        const newNotification = {
          message: data.message,
          createdAt: new Date().toISOString(),
          isRead: false,
        };
        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });

      socket.on("connect_error", (err) => {
        console.error("[Socket User] Error:", err.message);
      });
    }
  }, [token]);

  useEffect(() => {
    if (showNotificationDropdown && token) {
      loadNotifications();
    }
  }, [showNotificationDropdown, token]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target)
      ) {
        setShowProfileDropdown(false);
      }
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        !e.target.closest(".hamburger")
      ) {
        setMobileMenuOpen(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target)
      ) {
        setShowNotificationDropdown(false);
      }
      if (cartRef.current && !cartRef.current.contains(e.target)) {
        setShowCartDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const cartPreviewItems = getCartPreviewItems();

  return (
    <div className="navbar-container">
      <div className="navbar">
        <Link to="/">
          <img src={assets.w} alt="logo" className="navbar-logo" />
        </Link>

        <div
          className="hamburger"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <i className={mobileMenuOpen ? "bi bi-x-lg" : "bi bi-list"}></i>
        </div>

        <ul
          ref={menuRef}
          className={`navbar-menu ${mobileMenuOpen ? "active" : ""}`}
        >
          <Link
            to="/"
            onClick={() => {
              setMenu("home");
              setMobileMenuOpen(false);
            }}
            className={menu === "home" ? "active" : ""}
          >
            Beranda
          </Link>
          <Link
            to="/Menu"
            onClick={() => {
              setMenu("menu");
              setMobileMenuOpen(false);
            }}
            className={menu === "menu" ? "active" : ""}
          >
            Menu
          </Link>
          <Link
            to="/riwayat"
            onClick={() => {
              setMenu("pesanan");
              setMobileMenuOpen(false);
            }}
            className={menu === "pesanan" ? "active" : ""}
          >
            Pesanan
          </Link>
          <Link
            to="/chat"
            onClick={() => {
              setMenu("chat");
              setMobileMenuOpen(false);
            }}
            className={menu === "chat" ? "active" : ""}
          >
            Chat
          </Link>
          <Link
            to="/tentang-kami"
            onClick={() => {
              setMenu("tentang");
              setMobileMenuOpen(false);
            }}
            className={menu === "tentang" ? "active" : ""}
          >
            Tentang Kami
          </Link>
        </ul>

        <div className="navbar-right">
          <div className="search-container">
            <input
              type="text"
              placeholder="Mau Cari Apa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <i className="bi bi-search" onClick={handleSearch}></i>
          </div>

          <div className="navbar-search-icon" ref={cartRef}>
            <div
              onClick={() => setShowCartDropdown(!showCartDropdown)}
              style={{ cursor: "pointer" }}
            >
              <i className="bi bi-cart3"></i>
            </div>
            {getTotalCartItems() > 0 && (
              <div className="cart-badge">
                {getTotalCartItems() > 9 ? "9+" : getTotalCartItems()}
              </div>
            )}

            {showCartDropdown && getTotalCartItems() > 0 && (
              <div className="cart-dropdown">
                <div className="dropdown-header">
                  <h3>Keranjang Anda</h3>
                  <span>{getTotalCartItems()} item</span>
                </div>

                <div className="cart-items-preview">
                  {cartPreviewItems.map((item, index) => (
                    <div key={index} className="cart-item-preview">
                      <img src={item.image} alt={item.name} />
                      <div className="cart-item-info">
                        <div className="cart-item-name">{item.name}</div>
                        <div className="cart-item-price">
                          {item.quantity} x Rp {item.price.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {getTotalCartItems() > 3 && (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "10px",
                        fontSize: "12px",
                        color: "#666",
                      }}
                    >
                      +{getTotalCartItems() - 3} item lainnya
                    </div>
                  )}
                </div>

                <div className="cart-dropdown-footer">
                  <div className="cart-total-preview">
                    <span>Total:</span>
                    <span>Rp {getTotalCartAmount().toLocaleString()}</span>
                  </div>
                  <Link
                    to="/cart"
                    className="view-cart-btn"
                    onClick={() => setShowCartDropdown(false)}
                  >
                    Lihat Keranjang
                  </Link>
                </div>
              </div>
            )}
          </div>

          {!token ? (
            <button onClick={() => setShowLogin(true)}>Masuk</button>
          ) : (
            <>
              <div className="navbar-notification-icon" ref={notificationRef}>
                <i
                  className="bi bi-bell-fill"
                  onClick={() =>
                    setShowNotificationDropdown(!showNotificationDropdown)
                  }
                ></i>

                {unreadCount > 0 && (
                  <div className="dot-notif">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </div>
                )}

                {showNotificationDropdown && (
                  <div className="notification-dropdown">
                    <div className="dropdown-header">
                      <h3>Notifikasi</h3>
                      {unreadCount > 0 ? (
                        <button onClick={handleMarkAllRead}>
                          Tandai Semua Dibaca
                        </button>
                      ) : (
                        <p style={{ fontSize: "12px", color: "#888" }}>
                          Sudah dibaca semua
                        </p>
                      )}
                    </div>
                    <div className="dropdown-body">
                      {notifications.length > 0 ? (
                        <div className="notification-list">
                          {notifications.map((notif, index) => (
                            <Link
                              to="/riwayat"
                              key={index}
                              className={`notification-item ${
                                notif.isRead ? "" : "unread"
                              }`}
                              onClick={() => setShowNotificationDropdown(false)}
                            >
                              <div className="notif-message">
                                {notif.message}
                              </div>
                              <div className="notif-time">
                                {formatTime(notif.createdAt)}
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="no-notif">Tidak ada notifikasi.</p>
                      )}

                      <Link
                        to="/riwayat"
                        className="notif-footer-link"
                        onClick={() => setShowNotificationDropdown(false)}
                      >
                        Lihat Semua Pesanan
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="navbar-profile" ref={profileDropdownRef}>
                <div
                  className="profile-icon-circle"
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>

                {showProfileDropdown && (
                  <ul className="nav-profile-dropdown">
                    <Link
                      to="/profile/edit"
                      onClick={() => setShowProfileDropdown(false)}
                      className="dropdown-item edit-profile-link"
                    >
                      <i className="bi bi-gear"></i> Edit Profil
                    </Link>
                    <li className="dropdown-item logout" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right"></i> Keluar
                    </li>
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
