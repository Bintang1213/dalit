import React, { useContext, useEffect, useRef, useMemo } from "react";
import "./FoodDisplay.css";
import { StoreContext } from "../../context/StoreContext";
import FoodItem from "../FoodItem/FoodItem";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

const FoodDisplay = ({ category }) => {
  const { food_list, ratings } = useContext(StoreContext);
  const listRef = useRef(null);

  // Animasi
  useEffect(() => {
    if (!listRef.current) return;

    gsap.fromTo(
      listRef.current,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        scrollTrigger: {
          trigger: listRef.current,
          start: "top 80%",
        },
      }
    );
  }, []);

  // ===============================
  // ⭐ MERGE RATING SECARA AMAN
  // ===============================
  const foodWithRating = useMemo(() => {
    return (food_list || []).map((item) => {
      const r = ratings?.[item._id];

      return {
        ...item,
        avgRating: Number(r?.averageRating ?? item.avgRating ?? 0),
        totalReviews: Number(r?.reviewCount ?? item.totalReviews ?? 0),
        ratingCounts: r?.ratingCounts ?? item.ratingCounts ?? {},
      };
    });
  }, [food_list, ratings]);

  // ===============================
  // ⭐ CEK STATUS MENU (habis/nonaktif)
  // ===============================
  const isStatusAktif = (status) => {
    if (!status) return true;
    const s = status.toString().toLowerCase().trim();

    return !["habis", "sold out", "nonaktif", "tidak tersedia"].includes(s);
  };

  // ===============================
  // ⭐ LOGIKA REKOMENDASI
  // ===============================
  const isRekomendasi = (item) => {
    if (
      item.isRecommended === true ||
      item.isRecommended === "true" ||
      item.isRecommended === 1 ||
      item.isRecommended === "1"
    ) {
      return true;
    }
    return item.avgRating >= 4.5;
  };

  // ===============================
  // ⭐ FILTER FINAL SESUAI RULE BARU
  // ===============================
  const filteredList = useMemo(() => {
    return foodWithRating.filter((item) => {
      const aktif = isStatusAktif(item.status);

      if (category === "All") {
        return aktif && isRekomendasi(item);
      }
      return aktif && item.category === category;
    });
  }, [category, foodWithRating]);

  return (
    <div className="food-display" id="food-display">
      <h2>{category === "All" ? "Menu Rekomendasi" : `Menu ${category}`}</h2>

      <div className="food-display-list" ref={listRef}>
        {filteredList.length > 0 ? (
          filteredList.map((item) => (
            <FoodItem
              key={item._id}
              {...item}
              avgRating={item.avgRating}
              totalReviews={item.totalReviews}
              ratingCounts={item.ratingCounts}
            />
          ))
        ) : (
          <p className="empty-message">Belum ada menu untuk kategori ini.</p>
        )}
      </div>
    </div>
  );
};

export default FoodDisplay;
