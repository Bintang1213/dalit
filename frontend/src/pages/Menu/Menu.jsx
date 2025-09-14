import React, { useContext, useState } from "react";
import { StoreContext } from "../../context/StoreContext";
import FoodItem from "../../components/FoodItem/FoodItem";
import { FaFilter, FaStar } from "react-icons/fa";
import "./Menu.css";

const Menu = () => {
  const { food_list } = useContext(StoreContext);

  const categories = [...new Set(food_list.map((item) => item.category))];

  const [sortOrder, setSortOrder] = useState("");
  const [minRating, setMinRating] = useState(0);

  // Fungsi filter & sort
  const filterAndSortItems = (items) => {
    let filtered = [...items];

    // filter berdasarkan rating minimal
    if (minRating > 0) {
      filtered = filtered.filter((item) => item.rating >= minRating);
    }

    // urutan berdasarkan harga / rating
    if (sortOrder === "asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortOrder === "desc") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortOrder === "ratingAsc") {
      filtered.sort((a, b) => a.rating - b.rating);
    } else if (sortOrder === "ratingDesc") {
      filtered.sort((a, b) => b.rating - a.rating);
    }

    return filtered;
  };

  return (
    <div className="menu-page">
      {/* Kiri: daftar menu */}
      <div className="menu-left">
        {categories.map((category, idx) => {
          const items = filterAndSortItems(
            food_list.filter((item) => item.category === category)
          );

          return (
            <div key={idx} className="menu-category-section">
              <h2 className="menu-category-title">{category}</h2>
              <div className="menu-category-line"></div>
              <div className="menu-items">
                {items.length > 0 ? (
                  items.map((item) => (
                    <FoodItem
                      key={item._id}
                      id={item._id}
                      name={item.name}
                      description={item.description}
                      price={item.price}
                      image={item.image}
                      status={item.status}
                      rating={item.rating}
                    />
                  ))
                ) : (
                  <p className="empty-message">Tidak ada menu sesuai filter</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Kanan: filter panel */}
      <div className="menu-right">
        <h3 className="filter-title">
          <FaFilter className="filter-icon" /> Filter
        </h3>

        {/* Sort pakai radio */}
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

        {/* Filter Rating minimal */}
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