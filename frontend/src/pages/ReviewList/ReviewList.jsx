import React, { useEffect, useState } from "react";

const ReviewList = () => {
  const [reviews, setReviews] = useState([]);

  // ambil data review dari backend
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/reviews");
        const data = await res.json();
        setReviews(data);
      } catch (err) {
        console.error("Gagal mengambil review:", err);
      }
    };
    fetchReviews();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Ulasan Pengguna
        </h1>

        {reviews.length === 0 ? (
          <p className="text-gray-600">Belum ada ulasan tersedia.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review._id}
                className="bg-white shadow rounded-xl p-4 border border-gray-200 hover:shadow-lg transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-gray-700">
                    {review.username || "Anonim"}
                  </h2>
                  <span className="text-yellow-500 font-medium">
                    ⭐ {review.rating}/5
                  </span>
                </div>
                <p className="text-gray-600">{review.comment}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(review.createdAt).toLocaleDateString("id-ID")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewList;
