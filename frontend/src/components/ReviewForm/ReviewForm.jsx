import React, { useState } from "react";
import { FaStar } from "react-icons/fa";
import axios from "axios";
import "./ReviewForm.css"; // import css

const ReviewForm = ({ menuId, userId, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      alert("Silakan beri rating terlebih dahulu ⭐");
      return;
    }

    try {
      setLoading(true);
      await axios.post("http://localhost:4000/api/reviews", {
        menuId,
        userId,
        rating,
        comment,
      });
      setRating(0);
      setComment("");
      if (onReviewSubmitted) onReviewSubmitted();
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-form-container">
      <h2 className="review-form-title">Beri Ulasan Menu 🍴</h2>

      {/* Rating Stars */}
      <div className="review-stars">
        {[...Array(5)].map((_, index) => {
          const starValue = index + 1;
          return (
            <FaStar
              key={starValue}
              size={30}
              className={
                starValue <= (hover || rating)
                  ? "star-active"
                  : "star-inactive"
              }
              onClick={() => setRating(starValue)}
              onMouseEnter={() => setHover(starValue)}
              onMouseLeave={() => setHover(null)}
            />
          );
        })}
      </div>

      {/* Comment Box */}
      <textarea
        className="review-textarea"
        rows="4"
        placeholder="Tulis komentar kamu tentang menu ini..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      ></textarea>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="review-submit-btn"
      >
        {loading ? "Mengirim..." : "Kirim Ulasan"}
      </button>
    </div>
  );
};

export default ReviewForm;
