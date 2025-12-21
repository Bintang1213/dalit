import React, { useEffect, useState } from "react";
import axios from "axios";
import "./kelolaulasan.css";
import { toast } from "react-toastify";

const API_BASE = "http://localhost:4000/api/reviews";
const FOOD_API = "http://localhost:4000/api/food";

const KelolaUlasan = ({ isSidebarCollapsed }) => {
  const [reviews, setReviews] = useState([]);
  const [topMenus, setTopMenus] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const reviewsPerPage = 10;

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await axios.get(API_BASE);
        const data = Array.isArray(res.data) ? res.data : [];
        const sorted = data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setReviews(sorted);
      } catch {
        setReviews([]);
      }
    };

    const fetchTopMenus = async () => {
      try {
        const res = await axios.get(`${API_BASE}/top`);
        const menus = (Array.isArray(res.data) ? res.data : []).filter(
          (m) => m.name && m.name !== "Unknown" && m.totalReviews > 0
        );
        setTopMenus(menus);
      } catch {
        setTopMenus([]);
      }
    };

    fetchReviews();
    fetchTopMenus();
  }, []);

  const toggleRecommendation = async (menu) => {
    try {
      const res = await axios.post(`${FOOD_API}/update-recommendation`, {
        id: menu._id,
        isRecommended: !menu.isRecommended,
      });

      if (res.data.success) {
        toast.success("Status rekomendasi diperbarui");
        setTopMenus((prev) =>
          prev.map((m) =>
            m._id === menu._id
              ? { ...m, isRecommended: !m.isRecommended }
              : m
          )
        );
      }
    } catch {
      toast.error("Gagal update rekomendasi");
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm("Hapus ulasan ini?")) return;
    try {
      await axios.delete(`${API_BASE}/${id}`);
      setReviews((prev) => prev.filter((r) => r._id !== id));
      toast.success("Ulasan dihapus");
    } catch {
      toast.error("Gagal hapus ulasan");
    }
  };

  const totalPages = Math.ceil(reviews.length / reviewsPerPage);
  const startIndex = (currentPage - 1) * reviewsPerPage;
  const currentReviews = reviews.slice(
    startIndex,
    startIndex + reviewsPerPage
  );

  return (
    <div
      className={`main-content ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
    >
      <div className="ulasan-container">
        <h3 className="summary-title">Rangkuman Rating per Menu</h3>

        <div className="summary-cards">
          {topMenus.map((menu) => (
            <div key={menu._id} className="summary-card">
              <div className="menu-name">{menu.name}</div>
              <div className="menu-rating">
                ⭐ {menu.avgRating.toFixed(1)} ({menu.totalReviews} ulasan)
              </div>
            </div>
          ))}
        </div>

        <h3 className="section-title">Menu Terfavorit</h3>

        <div className="favorite-cards">
          {topMenus.map((menu) => (
            <div key={menu._id} className="favorite-card">
              <div className="menu-name">{menu.name}</div>
              <div className="menu-rating">
                ⭐ {menu.avgRating.toFixed(1)} ({menu.totalReviews})
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

        <h2 className="table-title">Kelola Ulasan</h2>

        <div className="table-container">
          <table className="tabel-ulasan">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama User</th>
                <th>Menu</th>
                <th>Rating</th>
                <th>Komentar</th>
                <th>Tanggal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {currentReviews.map((rev, i) => (
                <tr key={rev._id}>
                  <td>{startIndex + i + 1}</td>
                  <td>{rev.userId?.name || "Anonim"}</td>
                  <td>
                    {rev.foodId?.name || (
                      <span className="deleted-menu">Menu Dihapus</span>
                    )}
                  </td>
                  <td>{"⭐".repeat(rev.rating)}</td>
                  <td className="comment-cell">{rev.comment}</td>
                  <td>
                    {new Date(rev.createdAt).toLocaleDateString("id-ID")}
                  </td>
                  <td>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteReview(rev._id)}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            {"<"}
          </button>
          <span>
            Halaman {currentPage} dari {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            {">"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default KelolaUlasan;
