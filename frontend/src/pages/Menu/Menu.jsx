import React, { useContext, useState, useEffect, useMemo } from "react";
import { StoreContext } from "../../context/StoreContext";
import FoodItem from "../../components/FoodItem/FoodItem";
import { FaFilter, FaStar } from "react-icons/fa";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "./Menu.css";

const Menu = () => {
  const { food_list, url } = useContext(StoreContext);
  const [sortOrder, setSortOrder] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [ratingData, setRatingData] = useState([]); // ⭐ data rating dari backend

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get("search")?.toLowerCase() || "";

  const categories = [...new Set(food_list.map((item) => item.category))];

  // ==========================
  // 🔥 Ambil data rating dari backend
  // ==========================
  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/reviews/top");
        setRatingData(res.data);
        console.log("Data rating:", res.data);
      } catch (error) {
        console.error("Gagal ambil data rating:", error);
      }
    };
    fetchRatings();
  }, [url]);

  // Helper: ambil rating dari hasil agregasi jika ada
  const getRatingForFood = (foodId) => {
    const found = ratingData.find((r) => r._id === foodId);
    return found ? found.avgRating : 0;
  };

  // ==========================
  // 🎯 Filter dan sorting
  // ==========================
  const filteredFood = useMemo(() => {
    let items = [...food_list];

// Gabungkan data rating ke setiap item
items = items.map((item) => {
  const found = ratingData.find((r) => r._id === item._id);
  return {
    ...item,
    avgRating: found?.avgRating || 0,
    totalReviews: found?.totalReviews || 0,
    ratingCounts: found?.ratingCounts || {},
  };
});


    // 🔍 Filter pencarian
    if (searchQuery) {
      items = items.filter(
        (item) =>
          (item.name || "").toLowerCase().includes(searchQuery) ||
          (item.description || "").toLowerCase().includes(searchQuery)
      );
    }

    // ⭐ Filter rating minimal
    if (minRating > 0) {
  items = items.filter((item) => Number(item.avgRating || 0) >= minRating);
}


    // 💰 Urutkan harga
    if (sortOrder === "asc") {
      items.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortOrder === "desc") {
      items.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    }

    return items;
  }, [food_list, sortOrder, minRating, searchQuery, ratingData]);

  return (
    <div className="menu-page">
      {/* ==================== KIRI: DAFTAR MENU ==================== */}
      <div className="menu-left">
        {searchQuery ? (
          filteredFood.length > 0 ? (
            <div className="menu-category-section">
              <h2 className="menu-category-title">Hasil Pencarian</h2>
              <div className="menu-category-line"></div>
              <div className="menu-items">
                {filteredFood.map((item) => (
                  <FoodItem key={item._id} {...item} />
                ))}
              </div>
            </div>
          ) : (
            <p className="empty-message">Tidak ada menu sesuai pencarian</p>
          )
        ) : sortOrder || minRating > 0 ? (
          // === jika user memilih filter harga atau rating
          <div className="menu-category-section">
            <h2 className="menu-category-title">
              {minRating > 0
                ? `Rating ${minRating} ke atas`
                : sortOrder === "desc"
                ? "Harga Tertinggi - Terendah"
                : sortOrder === "asc"
                ? "Harga Terendah - Tertinggi"
                : ""}
            </h2>
            <div className="menu-category-line"></div>
            <div className="menu-items">
              {filteredFood.map((item) => (
                <FoodItem key={item._id} {...item} />
              ))}
            </div>
          </div>
        ) : (
          // === default: tampilkan berdasarkan kategori
          categories.map((category, idx) => {
            const items = filteredFood.filter(
              (item) => item.category === category
            );
            if (items.length === 0) return null;

            return (
              <div key={idx} className="menu-category-section">
                <h2 className="menu-category-title">{category}</h2>
                <div className="menu-category-line"></div>
                <div className="menu-items">
                  {items.map((item) => (
                    <FoodItem key={item._id} {...item} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ==================== KANAN: FILTER ==================== */}
      <div className="menu-right">
        <h3 className="filter-title">
          <FaFilter className="filter-icon" /> Filter
        </h3>

        {/* ===== URUTKAN ===== */}
        <div className="filter-section">
          <label>Urutkan</label>

          <div className="checkbox-option">
            <input
              type="radio"
              id="default"
              name="sort"
              value=""
              checked={sortOrder === ""}
              onChange={(e) => setSortOrder(e.target.value)}
            />
            <label htmlFor="default">Default</label>
          </div>

          <div className="checkbox-option">
            <input
              type="radio"
              id="hargaDesc"
              name="sort"
              value="desc"
              checked={sortOrder === "desc"}
              onChange={(e) => setSortOrder(e.target.value)}
            />
            <label htmlFor="hargaDesc">Harga Tertinggi - Terendah</label>
          </div>

          <div className="checkbox-option">
            <input
              type="radio"
              id="hargaAsc"
              name="sort"
              value="asc"
              checked={sortOrder === "asc"}
              onChange={(e) => setSortOrder(e.target.value)}
            />
            <label htmlFor="hargaAsc">Harga Terendah - Tertinggi</label>
          </div>
        </div>

        {/* ===== RATING ===== */}
        <div className="filter-section">
          <label>Rating Minimal</label>
          {[5, 4, 3, 2].map((stars) => (
            <div
              key={stars}
              className={`rating-filter ${minRating === stars ? "active" : ""}`}
              onClick={() => setMinRating(stars)}
            >
              {Array.from({ length: 5 }, (_, i) => (
                <FaStar
                  key={i}
                  className={i < stars ? "star filled" : "star"}
                />
              ))}
              <span className="rating-label"> ke atas</span>
            </div>
          ))}
          {minRating > 0 && (
            <button className="reset-btn" onClick={() => setMinRating(0)}>
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Menu;
