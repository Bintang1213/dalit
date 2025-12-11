// KelolaUlasan.jsx
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
      } catch (error) {
        setReviews([]);
      }
    };

    const fetchTopMenus = async () => {
      try {
        const res = await axios.get(`${API_BASE}/top`);
        let menus = Array.isArray(res.data) ? res.data : [];

        menus = menus.filter(
          (m) => m.name && m.name !== "Unknown" && m.totalReviews > 0
        );

        setTopMenus(menus);
      } catch (error) {
        setTopMenus([]);
      }
    };

    fetchReviews();
    fetchTopMenus();
  }, []);

  const toggleRecommendation = async (menu) => {
    try {
      const newStatus = !menu.isRecommended;

      const res = await axios.post(`${FOOD_API}/update-recommendation`, {
        id: menu._id,
        isRecommended: newStatus,
      });

      if (res.data.success) {
        toast.success("Status rekomendasi berhasil diubah.");
        setTopMenus((prev) =>
          prev.map((m) =>
            m._id === menu._id ? { ...m, isRecommended: newStatus } : m
          )
        );
      } else {
        toast.error("Gagal update rekomendasi.");
      }
    } catch {
      toast.error("Gagal update rekomendasi.");
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus ulasan ini?")) {
      try {
        const res = await axios.delete(`${API_BASE}/${reviewId}`);
        if (res.status === 200) {
          setReviews(reviews.filter((rev) => rev._id !== reviewId));
          toast.success("Ulasan berhasil dihapus!");
        } else {
          toast.error("Gagal menghapus ulasan.");
        }
      } catch {
        toast.error("Gagal menghapus ulasan.");
      }
    }
  };

  const totalPages = Math.ceil(reviews.length / reviewsPerPage);
  const startIndex = (currentPage - 1) * reviewsPerPage;
  const currentReviews = reviews.slice(startIndex, startIndex + reviewsPerPage);

  return (
    <div
      className={`container-ulasan ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
    >
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

      {topMenus.length > 0 && (
        <div className="favorite-section">
          <h3>Menu Terfavorit</h3>

          <div className="favorite-cards">
            {topMenus.map((menu) => (
              <div key={menu._id} className="favorite-card hover-up">
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

      <div className="kelola-ulasan-header">
        <h2>Kelola Ulasan</h2>
      </div>

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
              <tr key={rev._id} className="row-hover">
                <td>{startIndex + index + 1}</td>
                <td>{rev.userId?.name || "Anonim"}</td>
                <td>{rev.foodId?.name ?? "-"}</td>
                <td>{"⭐".repeat(rev.rating)}</td>
                <td className="comment-cell">{rev.comment}</td>
                <td>{new Date(rev.createdAt).toLocaleDateString()}</td>
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
    </div>
  );
};

export default KelolaUlasan;
