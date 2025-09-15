import React, { useEffect, useState } from "react";
import axios from "axios";
import "./kelolaulasan.css";

const API_BASE = "http://localhost:4000/api/reviews";

const KelolaUlasan = () => {
  const [reviews, setReviews] = useState([]);
  const [topMenus, setTopMenus] = useState([]);
  const [favorite, setFavorite] = useState(null);

  // ==============================
  // Fetch semua review
  // ==============================
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
        setTopMenus(Array.isArray(res.data) ? res.data : []);
        if (Array.isArray(res.data) && res.data.length > 0) {
          setFavorite(res.data[0]);
        }
      } catch (error) {
        console.error("Error fetch top menus:", error);
        setTopMenus([]);
        setFavorite(null);
      }
    };

    fetchReviews();
    fetchTopMenus();
  }, []);

  // ==============================
  // Toggle rekomendasi menu favorit
  // ==============================
  const toggleRecommendation = async () => {
    if (!favorite) return;
    try {
      const newStatus = !favorite.isRecommended;
      const res = await axios.put(
        `${API_BASE}/menu/${favorite._id}/recommendation`,
        { isRecommended: newStatus }
      );
      setFavorite((prev) => ({
        ...prev,
        isRecommended: res.data.menu.isRecommended,
      }));
    } catch (error) {
      console.error("Gagal update rekomendasi:", error);
    }
  };

  return (
    <div className="container-keuangan">
      <div className="kelola-keuangan-header">
        <h2>Kelola Ulasan</h2>
      </div>

      {/* Tabel review */}
      <div className="table-container">
        <table className="tabel-keuangan">
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
            {Array.isArray(reviews) &&
              reviews.map((rev) => (
                <tr key={rev._id}>
                  <td>{rev.userId?.name || "Anonim"}</td>
                  <td>{rev.menuId?.name || "-"}</td>
                  <td>{"⭐".repeat(rev.rating)}</td>
                  <td>{rev.comment}</td>
                  <td>{new Date(rev.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Rangkuman top menus */}
      <div className="summary-section" style={{ marginTop: "30px" }}>
        <h3>Rangkuman Rating per Menu</h3>
        <ul>
          {topMenus.map((menu) => (
            <li key={menu._id}>
              {menu._id} ⭐ {menu.avgRating?.toFixed(1)} ({menu.totalReviews} ulasan)
            </li>
          ))}
        </ul>
      </div>

      {/* Menu terfavorit */}
      {favorite && (
        <div className="favorite-section" style={{ marginTop: "30px" }}>
          <h3>Menu Terfavorit</h3>
          <p>
            {favorite._id} ⭐ {favorite.avgRating?.toFixed(1)} ({favorite.totalReviews} ulasan)
          </p>
          <button onClick={toggleRecommendation}>
            {favorite.isRecommended ? "Nonaktifkan Rekomendasi" : "Aktifkan Rekomendasi"}
          </button>
          {favorite.isRecommended && <p>✅ Menu ini sedang direkomendasikan</p>}
        </div>
      )}
    </div>
  );
};

export default KelolaUlasan;
