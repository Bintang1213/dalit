import React, { useState, useEffect, useContext } from "react";
import { FaStar } from "react-icons/fa";
import axios from "axios";
import "./ReviewForm.css";
import { StoreContext } from "../../context/StoreContext"; // sesuaikan path context-mu

const ReviewForm = ({ order, onReviewSubmitted, isReadOnly }) => {
  const { user } = useContext(StoreContext);
  const userId = user?._id;

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReview = async () => {
      if (!order?._id || !userId) return;

      try {
        const res = await axios.get(
          `http://localhost:4000/api/reviews/order/${order._id}?userId=${userId}`
        );

        if (res.data?.reviewed) {
          setRating(res.data.review.rating);
          setComment(res.data.review.comment || "");
        }
      } catch (err) {
        console.error("Gagal ambil review:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReview();
  }, [order, userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly || !userId) return;

    try {
      await axios.post("http://localhost:4000/api/reviews", {
        userId,
        orderId: order._id,
        rating,
        comment,
      });
      alert("✅ Rating berhasil dikirim");
      onReviewSubmitted?.();
    } catch (err) {
      alert(err.response?.data?.message || "❌ Gagal kirim rating");
    }
  };

  if (loading) return <div>Memuat...</div>;

  // --- Mode lihat rating ---
  if (isReadOnly) {
    return (
      <div className="review-readonly-card">
        <h3 className="review-form-title">Rating Kamu</h3>
        <div className="review-stars">
          {[...Array(5)].map((_, i) => {
            const starValue = i + 1;
            return (
              <FaStar
                key={starValue}
                size={26}
                color={starValue <= rating ? "#facc15" : "#e5e7eb"}
              />
            );
          })}
        </div>
        <div className="review-comment">{comment || "Tanpa komentar"}</div>
      </div>
    );
  }

  // --- Mode beri rating ---
  return (
    <form className="review-form-container" onSubmit={handleSubmit}>
      <h3 className="review-form-title">Beri Ulasan Pesanan</h3>

      <div className="review-stars">
        {[...Array(5)].map((_, i) => {
          const starValue = i + 1;
          return (
            <FaStar
              key={starValue}
              size={28}
              color={starValue <= (hover || rating) ? "#facc15" : "#e5e7eb"}
              onMouseEnter={() => setHover(starValue)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(starValue)}
              style={{ cursor: "pointer" }}
            />
          );
        })}
      </div>

      <textarea
        className="review-textarea"
        value={comment}
        placeholder="Tulis komentar..."
        onChange={(e) => setComment(e.target.value)}
      />

      <button type="submit" className="review-submit-btn" disabled={!rating}>
        Kirim Ulasan
      </button>
    </form>
  );
};

export default ReviewForm;
