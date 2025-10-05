import React, { useEffect, useState, useContext } from "react";
import "./OrderHistory.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import moment from "moment-timezone";
import {
  FaClock,
  FaCogs,
  FaCheckCircle,
  FaTimesCircle,
  FaQuestionCircle,
} from "react-icons/fa";
import ReviewForm from "../../components/ReviewForm/ReviewForm";
import { StoreContext } from "../../context/StoreContext"; // 👉 tambahin ini

const OrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [recommendations, setRecommendations] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // ID pesanan yang sudah di-review
  const [reviewedOrderIds, setReviewedOrderIds] = useState(new Set());
  const [isReadOnly, setIsReadOnly] = useState(false);

  // 👉 ambil setCartItems dari StoreContext
  const { setCartItems } = useContext(StoreContext);

  const formatCurrency = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "menunggu":
        return "status-menunggu";
      case "diproses":
        return "status-diproses";
      case "selesai":
        return "status-selesai";
      case "gagal":
        return "status-gagal";
      default:
        return "status-unknown";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "menunggu":
        return <FaClock />;
      case "diproses":
        return <FaCogs />;
      case "selesai":
        return <FaCheckCircle />;
      case "gagal":
        return <FaTimesCircle />;
      default:
        return <FaQuestionCircle />;
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

        const response = await axios.get(
          "http://localhost:4000/api/order/user",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Ambil ID pesanan yang sudah di-review
        const reviewedIds = new Set(
          response.data.data
            .filter((order) => order.reviewed)
            .map((order) => order._id.toString())
        );

        setOrders(response.data.data);
        setReviewedOrderIds(reviewedIds);
      } catch (err) {
        setError("Gagal memuat riwayat pesanan");
      } finally {
        setLoading(false);
      }
    };

    const fetchRecommendations = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/reviews/top");
        setRecommendations(res.data);
      } catch (error) {
        console.error(
          "Gagal ambil rekomendasi:",
          error?.response?.data || error.message
        );
      }
    };

    fetchOrders();
    fetchRecommendations();
  }, []);

  const handleReviewClick = (order) => {
    setSelectedOrder(order);
    setShowReviewModal(true);
    setIsReadOnly(false); // Mode beri rating
  };

  const handleViewRatingClick = (order) => {
    setSelectedOrder(order);
    setShowReviewModal(true);
    setIsReadOnly(true); // Mode read-only
  };

  const onReviewSubmitted = () => {
    setReviewedOrderIds((prev) =>
      new Set(prev).add(selectedOrder._id.toString())
    );
    setShowReviewModal(false);
    setSelectedOrder(null);
    setIsReadOnly(false);
  };

  // 👉 Fungsi Reorder
  const handleReorder = (order) => {
    try {
      const newCart = {};

      order.items.forEach((item) => {
        // pastikan pakai field yang benar (foodId atau _id)
        const id = item.foodId || item._id;
        newCart[id] = item.quantity || item.qty || 1;
      });

      setCartItems(newCart); // update context
      navigate("/cart");
    } catch (err) {
      console.error("Gagal reorder:", err);
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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "50vh",
            textAlign: "center",
            padding: "2rem",
          }}
        >
          <h3
            style={{ fontWeight: "600", color: "#333", marginBottom: "0.5rem" }}
          >
            Anda belum login
          </h3>
          <p style={{ color: "#666" }}>
            Silakan login untuk melihat riwayat pesanan Anda.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="order-history">
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
            {currentOrders.map((order) => (
              <tr key={order._id}>
                <td>{moment(order.createdAt).format("DD/MM/YYYY HH:mm")}</td>
                <td className="ellipsis">
                  {order.items.map((item) => item.name).join(", ")}
                </td>
                <td>{order.payment}</td>
                <td>{order.method}</td>
                <td>{formatCurrency(order.totalAmount)}</td>
                <td className={getStatusClass(order.status)}>
                  {getStatusIcon(order.status)} {order.status}
                </td>
                <td
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <button
                      className="view-detail-btn"
                      onClick={() => navigate("/struk", { state: { order } })}
                    >
                      Lihat Detail
                    </button>

                    {/* Rating Button */}
                    {order.status.toLowerCase() === "selesai" &&
                      (reviewedOrderIds.has(order._id.toString()) ? (
                        <button
                          className="view-rating-btn"
                          onClick={() => handleViewRatingClick(order)}
                        >
                          Lihat Rating
                        </button>
                      ) : (
                        <button
                          className="rate-btn"
                          onClick={() => handleReviewClick(order)}
                        >
                          Beri Rating
                        </button>
                      ))}

                    {/* 👉 Tambahkan kondisi ini */}
                    {order.status.toLowerCase() === "selesai" && (
                      <button
                        className="reorder-btn"
                        onClick={() => handleReorder(order)}
                      >
                        Pesan Lagi
                      </button>
                    )}
                  </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index + 1}
            className={currentPage === index + 1 ? "active" : ""}
            onClick={() => paginate(index + 1)}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {showReviewModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <ReviewForm
              order={selectedOrder}
              onReviewSubmitted={onReviewSubmitted}
              isReadOnly={isReadOnly}
            />
            <button
              className="close-modal"
              onClick={() => {
                setShowReviewModal(false);
                setSelectedOrder(null);
                setIsReadOnly(false);
              }}
            >
              ✖
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;