import React, { useEffect, useState } from 'react'; 
import "./OrderHistory.css";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment-timezone';
import { FaClock, FaCogs, FaCheckCircle, FaTimesCircle, FaQuestionCircle, FaStar } from 'react-icons/fa';

const OrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // state untuk review
  const [reviews, setReviews] = useState({}); 

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // 🔥 state rekomendasi
  const [recommendations, setRecommendations] = useState([]);

  const formatCurrency = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(number);
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'menunggu': return 'status-menunggu';
      case 'diproses': return 'status-diproses';
      case 'selesai': return 'status-selesai';
      case 'gagal': return 'status-gagal';
      default: return 'status-unknown';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'menunggu': return <FaClock />;
      case 'diproses': return <FaCogs />;
      case 'selesai': return <FaCheckCircle />;
      case 'gagal': return <FaTimesCircle />;
      default: return <FaQuestionCircle />;
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Anda belum login");
          setLoading(false);
          return;
        }

        const response = await axios.get('http://localhost:4000/api/order/user', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setOrders(response.data.data);
      } catch (err) {
        setError('Gagal memuat riwayat pesanan');
      } finally {
        setLoading(false);
      }
    };

    // 🔥 Ambil rekomendasi menu dari backend
    const fetchRecommendations = async () => {
      try {
        // ⬇️ ganti review -> reviews
        const res = await axios.get("http://localhost:4000/api/reviews/top");
        setRecommendations(res.data);
      } catch (error) {
        console.error("Gagal ambil rekomendasi:", error?.response?.data || error.message);
      }
    };

    fetchOrders();
    fetchRecommendations();
  }, []);

  const handleReviewChange = (orderId, itemId, field, value) => {
    setReviews(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [itemId]: {
          ...prev[orderId]?.[itemId],
          [field]: value
        }
      }
    }));
  };

  const handleSubmitReview = async (orderId, itemId) => {
    try {
      const token = localStorage.getItem("token");
      const review = reviews[orderId]?.[itemId];

      if (!review?.rating) {
        alert("Harap isi rating!");
        return;
      }

      await axios.post("http://localhost:4000/api/reviews", {
        userId: orders.find(o => o._id === orderId).userId,
        menuId: itemId,
        rating: review.rating,
        comment: review.comment || ""
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Review berhasil dikirim!");
    } catch (error) {
      alert("Gagal mengirim review");
    }
  };

  const indexOfLastOrder = currentPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(orders.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (error) {
    return (
      <div className="order-history">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <h3 style={{ fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
            Anda belum login
          </h3>
          <p style={{ color: '#666' }}>
            Silakan login untuk melihat riwayat pesanan Anda.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="order-history">
      {/* 🔥 Rekomendasi menu */}
      {recommendations.length > 0 && (
        <div className="recommendation-section">
          <h3>🍽️ Rekomendasi Menu Untuk Anda</h3>
          <ul>
            {recommendations.map((menu, idx) => (
              <li key={idx}>
                {menu._id} ⭐ {menu.avgRating?.toFixed(1) || 0} ({menu.totalReviews} ulasan)
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="table-wrapper">
        <table className="order-table">
          <thead>
            <tr>
              <th>Waktu Pesan</th>
              <th>Pesanan</th>
              <th>Pembayaran</th>
              <th>Layanan</th>
              <th>Total</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {currentOrders.map((order, index) => (
              <React.Fragment key={index}>
                <tr>
                  <td>{moment(order.createdAt).format('DD/MM/YYYY HH:mm')}</td>
                  <td className="ellipsis">{order.items.map(item => item.name).join(', ')}</td>
                  <td>{order.payment}</td>
                  <td>{order.method}</td>
                  <td>{formatCurrency(order.totalAmount)}</td>
                  <td className={getStatusClass(order.status)}>
                    {getStatusIcon(order.status)} {order.status}
                  </td>
                  <td>
                    <button
                      className="view-detail-btn"
                      onClick={() => navigate('/struk', { state: { order } })}
                    >
                      Lihat Detail
                    </button>
                  </td>
                </tr>

                {/* Review muncul hanya jika status selesai */}
                {order.status.toLowerCase() === "selesai" && (
                  <tr>
                    <td colSpan="7">
                      <div className="review-section">
                        <h4>Review Pesanan:</h4>
                        {order.items.map(item => (
                          <div key={item._id} className="review-form">
                            <p><b>{item.name}</b></p>
                            <div className="rating">
                              {[1, 2, 3, 4, 5].map(star => (
                                <FaStar
                                  key={star}
                                  onClick={() => handleReviewChange(order._id, item._id, "rating", star)}
                                  style={{
                                    cursor: "pointer",
                                    color: (reviews[order._id]?.[item._id]?.rating || 0) >= star ? "gold" : "gray"
                                  }}
                                />
                              ))}
                            </div>
                            <textarea
                              placeholder="Tulis komentar..."
                              value={reviews[order._id]?.[item._id]?.comment || ""}
                              onChange={e => handleReviewChange(order._id, item._id, "comment", e.target.value)}
                            />
                            <button onClick={() => handleSubmitReview(order._id, item._id)}>
                              Kirim Review
                            </button>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index + 1}
            className={currentPage === index + 1 ? 'active' : ''}
            onClick={() => paginate(index + 1)}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default OrderHistory;
