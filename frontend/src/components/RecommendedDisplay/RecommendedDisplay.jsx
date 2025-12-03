// src/components/RecommendedDisplay/RecommendedDisplay.jsx
import React, { useState, useEffect } from "react";
import FoodItem from "../FoodItem/FoodItem";
import axios from "axios";
import "./RecommendedDisplay.css";

const RecommendedDisplay = () => {
  const [recommendedList, setRecommendedList] = useState([]);
  const [ratingData, setRatingData] = useState([]);

  // =============================
  // 🔥 Fetch data rekomendasi
  // =============================
  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const response = await fetch(
          "http://localhost:4000/api/food/recommendations"
        );
        const result = await response.json();

        if (result.success) {
          setRecommendedList(result.data);
        }
      } catch (error) {
        console.error("Error fetch rekomendasi:", error);
      }
    };

    fetchRecommended();
  }, []);

  // =============================
  // 🔥 Fetch rating MENGIKUTI MENU.JSX
  // =============================
useEffect(() => {
  const fetchRatings = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/reviews/top");
      const result = await response.json();
      setRatingData(result);
    } catch (error) {
      console.error("Error fetching ratings:", error);
    }
  };

  fetchRatings();
}, []);


  // =============================
  // Gabungkan rating ke item rekomendasi
  // =============================
  const mergedList = recommendedList.map((item) => {
    const found = ratingData.find((r) => r._id === item._id);
    return {
      ...item,
      avgRating: found?.avgRating || 0,
      totalReviews: found?.totalReviews || 0,
      ratingCounts: found?.ratingCounts || {}
    };
  });

  return (
    <div className="recommended-display" id="recommended-display">
      <h2>Menu Rekomendasi</h2>

      {mergedList.length > 0 ? (
        <div className="recommended-list">
          {mergedList.map((item) => (
            <FoodItem
              key={item._id}
              {...item}
            />
          ))}
        </div>
      ) : (
        <p>Tidak ada menu yang direkomendasikan saat ini.</p>
      )}
    </div>
  );
};

export default RecommendedDisplay;
