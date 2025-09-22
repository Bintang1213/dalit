import React, { useState, useEffect } from "react";
import { FaStar } from "react-icons/fa";
import axios from "axios";
import "./ReviewForm.css";

const ReviewForm = ({ order, onReviewSubmitted, isReadOnly }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReview = async () => {
      if (isReadOnly) {
        try {
          const res = await axios.get(`http://localhost:4000/api/reviews/order/${order._id}`);
          setRating(res.data.rating);
          setComment(res.data.comment || "");
        } catch (err) {
          console.error("Gagal ambil review:", err.response?.data || err.message);
        } finally {
          setLoading(false);
        }
      } else {
        setRating(0);
        setComment("");
        setLoading(false);
      }
    };
    fetchReview();
  }, [order, isReadOnly]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;

    try {
      await axios.post("http://localhost:4000/api/reviews", {
        userId: order.userId,
        orderId: order._id,
        rating,
        comment,
      });
      alert("✅ Rating berhasil dikirim");
      onReviewSubmitted();
    } catch (err) {
      alert(err.response?.data?.message || "❌ Gagal kirim rating");
    }
  };

  if (loading) return <div>Memuat...</div>;

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <h3>{isReadOnly ? "Rating Kamu" : "Beri Ulasan Pesanan"}</h3>
      <div className="rating">
        {[...Array(5)].map((_, i) => {
          const starValue = i + 1;
          return (
            <FaStar
              key={starValue}
              size={28}
              color={starValue <= (hover || rating) ? "#ffc107" : "#e4e5e9"}
              onMouseEnter={() => !isReadOnly && setHover(starValue)}
              onMouseLeave={() => !isReadOnly && setHover(0)}
              onClick={() => !isReadOnly && setRating(starValue)}
              style={{ cursor: isReadOnly ? "default" : "pointer" }}
            />
          );
        })}
      </div>

      <textarea
        value={comment}
        placeholder="Tulis komentar..."
        readOnly={isReadOnly}
        onChange={(e) => setComment(e.target.value)}
      />

      {!isReadOnly && <button type="submit">Kirim Ulasan</button>}
    </form>
  );
};

export default ReviewForm;
