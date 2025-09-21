import React, { useEffect, useState } from "react";
import axios from "axios";
import "./kelolaulasan.css";
import { toast } from "react-toastify"; // Pastikan Anda mengimpor toast

const API_BASE = "http://localhost:4000/api/reviews"; // Ini rute untuk ulasan
const FOOD_API = "http://localhost:4000/api/food"; // Kita butuh rute baru untuk makanan

const KelolaUlasan = ({ isSidebarCollapsed }) => {
  const [reviews, setReviews] = useState([]);
  const [topMenus, setTopMenus] = useState([]);

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
        // ✅ Ambil hingga 5 menu teratas
        setTopMenus(menus.slice(0, 5));
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
        // ✅ Perbarui status di frontend tanpa memuat ulang seluruh data
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
      {/* ✅ Logika baru: Tampilkan semua menu terfavorit yang diambil */}
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
                  className={`btn-recommend ${menu.isRecommended ? "active" : ""}`}
                  onClick={() => toggleRecommendation(menu)}
                >
                  {menu.isRecommended ? "Nonaktifkan Rekomendasi" : "Aktifkan Rekomendasi"}
                </button>
                {menu.isRecommended && <p className="recommended-text">✅ Menu ini sedang direkomendasikan</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default KelolaUlasan;