import React, { useEffect, useState } from "react";
import axios from "axios";
import "./kelolaulasan.css";

const API_BASE = "http://localhost:4000/api/reviews";

const KelolaUlasan = ({ isSidebarCollapsed }) => {
  const [reviews, setReviews] = useState([]);
  const [topMenus, setTopMenus] = useState([]);
  const [favorite, setFavorite] = useState(null);

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

        if (menus.length > 0) setFavorite(menus[0]);
      } catch (error) {
        console.error("Error fetch top menus:", error);
        setTopMenus([]);
        setFavorite(null);
      }
    };

    fetchReviews();
    fetchTopMenus();
  }, []);

  const toggleRecommendation = async () => {
    if (!favorite) return;

    try {
      const res = await axios.put(
        `${API_BASE}/menu/${favorite._id}/recommendation`
      );

      setFavorite((prev) => ({
        ...prev,
        isRecommended: res.data.food.isRecommended,
      }));

      setTopMenus((prev) =>
        prev.map((m) =>
          m._id === favorite._id
            ? { ...m, isRecommended: res.data.food.isRecommended }
            : m
        )
      );
    } catch (error) {
      console.error("Gagal update rekomendasi:", error);
    }
  };

  return (
    <div className={`container-ulasan ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <div className="kelola-ulasan-header">
        <h2>Kelola Ulasan</h2>
      </div>

      {/* Tabel review */}
      <div className="table-container">
        <table className="tabel-ulasan">
          <thead>
            <tr>
              <th>Nama User</th>
              <th>Nama Menu</th>
              <th>Rating</th>
              <th>Komentar</th>
              <th>Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((rev) => (
              <tr key={rev._id}>
                <td>{rev.userId?.name || "Anonim"}</td>
                <td>{rev.foodId?.name || "-"}</td>
                <td>{"⭐".repeat(rev.rating)}</td>
                <td className="comment-cell">{rev.comment}</td>
                <td>{new Date(rev.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rangkuman top menus */}
      <div className="summary-section">
        <h3>Rangkuman Rating per Menu</h3>
        <div className="summary-cards">
          {topMenus.map((menu) => (
            <div key={menu._id} className="summary-card">
              <div className="menu-name">{menu.name}</div>
              <div className="menu-rating">
                ⭐ {menu.avgRating?.toFixed(1)} <span>({menu.totalReviews} ulasan)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Menu terfavorit */}
      {favorite && (
        <div className="favorite-section">
          <h3>Menu Terfavorit</h3>
          <div className="favorite-card">
            <div className="menu-name">{favorite.name}</div>
            <div className="menu-rating">
              ⭐ {favorite.avgRating?.toFixed(1)} ({favorite.totalReviews} ulasan)
            </div>
            <button
              className={`btn-recommend ${favorite.isRecommended ? "active" : ""}`}
              onClick={toggleRecommendation}
            >
              {favorite.isRecommended ? "Nonaktifkan Rekomendasi" : "Aktifkan Rekomendasi"}
            </button>
            {favorite.isRecommended && <p className="recommended-text">✅ Menu ini sedang direkomendasikan</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default KelolaUlasan;
