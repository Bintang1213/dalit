// src/components/KelolaUlasan/KelolaUlasan.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./kelolaulasan.css";
import { toast } from "react-toastify";
import { FaStar } from "react-icons/fa";

const API_BASE = "http://localhost:4000/api/reviews";
const FOOD_API = "http://localhost:4000/api/food";

const KelolaUlasan = ({ isSidebarCollapsed }) => {
  const [reviews, setReviews] = useState([]);
  const [topMenus, setTopMenus] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReview, setSelectedReview] = useState(null); // ✅ untuk simpan order yg dipilih
  const [history, setHistory] = useState([]); // ✅ data history rating
  const [showPopup, setShowPopup] = useState(false);

  const reviewsPerPage = 10;

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await axios.get(API_BASE);
        setReviews(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Error fetch reviews:", error);
        setReviews([]);
      }
    };

    const fetchTopMenus = async () => {
      try {
        const res = await axios.get(`${API_BASE}/top`);
        const menus = Array.isArray(res.data) ? res.data : [];
        setTopMenus(menus);
      } catch (error) {
        console.error("Error fetch top menus:", error);
        setTopMenus([]);
      }
    };

    fetchReviews();
    fetchTopMenus();
  }, []);

  const toggleRecommendation = async (menu) => {
    try {
      const currentIsRecommended = menu.isRecommended;
      const newIsRecommended = !currentIsRecommended;

      const res = await axios.post(`${FOOD_API}/update-recommendation`, {
        id: menu._id,
        isRecommended: newIsRecommended,
      });

      if (res.data.success) {
        toast.success(`Status rekomendasi berhasil diubah.`);
        setTopMenus((prev) =>
          prev.map((m) =>
            m._id === menu._id
              ? { ...m, isRecommended: newIsRecommended }
              : m
          )
        );
      } else {
        toast.error("Gagal update rekomendasi.");
      }
    } catch (error) {
      console.error("Gagal update rekomendasi:", error);
      toast.error("Gagal update rekomendasi. Coba lagi nanti.");
    }
  };

  // --- buka popup history rating ---
  const handleViewHistory = async (rev) => {
    try {
      setSelectedReview(rev);
      setShowPopup(true);
      const res = await axios.get(
        `${API_BASE}/order/${rev.orderId}?userId=${rev.userId?._id}`
      );
      setHistory(res.data.reviews || []);
    } catch (err) {
      console.error("Gagal ambil history:", err);
      toast.error("Gagal ambil history rating.");
    }
  };

  // --- Pagination logic ---
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);
  const startIndex = (currentPage - 1) * reviewsPerPage;
  const currentReviews = reviews.slice(startIndex, startIndex + reviewsPerPage);

  return (
    <div
      className={`container-ulasan ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
    >
      {/* 🔄 Rangkuman Rating */}
      <div className="summary-section">
        <h3>Rangkuman Rating per Menu</h3>
        <div className="summary-cards">
          {topMenus.map((menu) => (
            <div key={menu._id} className="summary-card">
              <div className="menu-name">{menu.name}</div>
              <div className="menu-rating">
                ⭐ {menu.avgRating?.toFixed(1)}{" "}
                <span>({menu.totalReviews} ulasan)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🔄 Menu Terfavorit */}
      {topMenus.length > 0 && (
        <div className="favorite-section">
          <h3>Menu Terfavorit</h3>
          <div className="favorite-cards">
            {topMenus.map((menu) => (
              <div key={menu._id} className="favorite-card">
                <div className="menu-name">{menu.name}</div>
                <div className="menu-rating">
                  ⭐ {menu.avgRating?.toFixed(1)} ({menu.totalReviews} ulasan)
                </div>
                <button
                  className={`btn-recommend ${
                    menu.isRecommended ? "active" : ""
                  }`}
                  onClick={() => toggleRecommendation(menu)}
                >
                  {menu.isRecommended
                    ? "Nonaktifkan Rekomendasi"
                    : "Aktifkan Rekomendasi"}
                </button>
                {menu.isRecommended && (
                  <p className="recommended-text">
                    ✅ Menu ini sedang direkomendasikan
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Judul kelola ulasan */}
      <div className="kelola-ulasan-header">
        <h2>Kelola Ulasan</h2>
      </div>

      {/* 🔽 Tabel review */}
      <div className="table-container">
        <table className="tabel-ulasan">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama User</th>
              <th>Nama Menu</th>
              <th>Rating</th>
              <th>Komentar</th>
              <th>Tanggal</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {currentReviews.map((rev, index) => (
              <tr key={rev._id}>
                <td>{startIndex + index + 1}</td>
                <td>{rev.userId?.name || "Anonim"}</td>
                <td>{rev.foodId?.name || "-"}</td>
                <td>{"⭐".repeat(rev.rating)}</td>
                <td className="comment-cell">{rev.comment}</td>
                <td>{new Date(rev.createdAt).toLocaleDateString()}</td>
                <td>
                  <button
                    className="btn-history"
                    onClick={() => handleViewHistory(rev)}
                  >
                    Lihat Rating
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🔽 Pagination */}
      <div className="pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
        >
          {"<"}
        </button>
        <span>
          halaman {currentPage} dari {totalPages}
        </span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
        >
          {">"}
        </button>
      </div>

      {/* 🔽 Popup history rating */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>History Rating</h3>
            <p>
              User: <b>{selectedReview?.userId?.name}</b>
            </p>
            <p>
              Order ID: <b>{selectedReview?.orderId}</b>
            </p>

            <div className="history-list">
              {history.length > 0 ? (
                history.map((h) => (
                  <div key={h._id} className="history-item">
                    <div className="history-menu">{h.foodId?.name}</div>
                    <div className="history-stars">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          size={20}
                          color={i < h.rating ? "#ffc107" : "#e4e5e9"}
                        />
                      ))}
                    </div>
                    <div className="history-comment">"{h.comment}"</div>
                    <div className="history-date">
                      {new Date(h.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <p>Tidak ada history rating.</p>
              )}
            </div>

            <button className="btn-close" onClick={() => setShowPopup(false)}>
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KelolaUlasan;
