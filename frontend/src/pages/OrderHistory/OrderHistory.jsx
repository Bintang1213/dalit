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
  FaBan,
  FaQuestionCircle,
} from "react-icons/fa";
import ReviewForm from "../../components/ReviewForm/ReviewForm";
import { StoreContext } from "../../context/StoreContext";

const OrderHistory = () => {
  const navigate = useNavigate();
  const { setCartItems } = useContext(StoreContext);

  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reviewedOrderIds, setReviewedOrderIds] = useState(new Set());
  const [isReadOnly, setIsReadOnly] = useState(false);

  const formatCurrency = (number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);

  /**
   * 🔥 Tentukan status FINAL yang dipakai UI
   */
  const normalizeStatus = (rawStatus = "") => {
  const s = rawStatus.toLowerCase();

  if (s.includes("menunggu")) return "menunggu";
  if (s.includes("diproses")) return "diproses";
  if (s.includes("selesai") || s.includes("berhasil")) return "selesai";
  if (s.includes("dibatalkan")) return "dibatalkan";
  if (s.includes("gagal")) return "gagal";

  return "unknown";
};

const getFinalStatus = (order) => {
  if (order.paymentStatus) {
    return normalizeStatus(order.paymentStatus);
  }
  return normalizeStatus(order.status);
};


  const getStatusIcon = (status) => {
    switch (status) {
      case "menunggu":
        return <FaClock />;
      case "diproses":
        return <FaCogs />;
      case "selesai":
      case "berhasil":
        return <FaCheckCircle />;
      case "gagal":
        return <FaTimesCircle />;
      case "dibatalkan":
        return <FaBan />;
      default:
        return <FaQuestionCircle />;
    }
  };

  const getStatusLabel = (status) => {
  switch (status) {
    case "menunggu":
      return "Menunggu Pembayaran";
    case "diproses":
      return "Sedang Diproses";
    case "selesai":
      return "Pembayaran Berhasil";
    case "dibatalkan":
      return "Pembayaran Dibatalkan";
    case "gagal":
      return "Pembayaran Gagal";
    default:
      return "Status Tidak Diketahui";
  }
};

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Anda belum login");
          return;
        }

        const res = await axios.get(
          "http://localhost:4000/api/order/user",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const reviewedIds = new Set(
          res.data.data
            .filter((o) => o.reviewed)
            .map((o) => o._id.toString())
        );

        setOrders(res.data.data);
        setReviewedOrderIds(reviewedIds);
      } catch {
        setError("Gagal memuat riwayat pesanan");
      }
    };

    fetchOrders();
  }, []);

  const handleReviewClick = (order) => {
    setSelectedOrder(order);
    setIsReadOnly(false);
    setShowReviewModal(true);
  };

  const handleViewRatingClick = (order) => {
    setSelectedOrder(order);
    setIsReadOnly(true);
    setShowReviewModal(true);
  };

  const onReviewSubmitted = () => {
    setReviewedOrderIds(
      (prev) => new Set(prev).add(selectedOrder._id.toString())
    );
    setShowReviewModal(false);
    setSelectedOrder(null);
    setIsReadOnly(false);
  };

  const handleReorder = (order) => {
    const newCart = {};
    order.items.forEach((item) => {
      const id = item.foodId || item._id;
      newCart[id] = item.quantity || item.qty || 1;
    });
    setCartItems(newCart);
    navigate("/cart");
  };

  const indexOfLast = currentPage * itemsPerPage;
  const currentOrders = orders.slice(indexOfLast - itemsPerPage, indexOfLast);
  const totalPages = Math.ceil(orders.length / itemsPerPage);

  if (error) {
    return (
      <div className="order-history empty">
        <h3>{error}</h3>
      </div>
    );
  }

  return (
    <div className="order-history">
      {currentOrders.map((order) => {
        const finalStatus = getFinalStatus(order);
        const isFinished = finalStatus === "selesai" || finalStatus === "berhasil";
        const isFailed =
          finalStatus === "gagal" || finalStatus === "dibatalkan";
        const isReviewed = reviewedOrderIds.has(order._id.toString());

        return (
          <div
            key={order._id}
            className={`order-card status-${finalStatus}`}
          >
            <div className="order-top">
              <span className={`status-badge ${finalStatus}`}>
                {getStatusIcon(finalStatus)} {getStatusLabel(finalStatus)}
              </span>
              <span className="order-date">
                {moment(order.createdAt).format("DD MMM YYYY • HH:mm")}
              </span>
            </div>

            <div className="order-main">
              <div className="order-info">
                <div className="order-title">
                  Pesanan: {order.items.map((i) => i.name).join(", ")}
                </div>
                <div className="order-sub">
                  {order.payment} • {order.method}
                </div>
              </div>

              <div className="order-right">
                <div className="order-total">
                  {formatCurrency(order.totalAmount)}
                </div>

                <div className="order-actions">
                  <button
                    className="btn-outline"
                    onClick={() =>
                      navigate("/struk", { state: { order } })
                    }
                  >
                    Lihat Detail
                  </button>

                  {isFinished &&
                    (isReviewed ? (
                      <button
                        className="btn-success"
                        onClick={() => handleViewRatingClick(order)}
                      >
                        Lihat Rating
                      </button>
                    ) : (
                      <button
                        className="btn-warning"
                        onClick={() => handleReviewClick(order)}
                      >
                        Beri Rating
                      </button>
                    ))}

                  {isFinished && (
                    <button
                      className="btn-primary"
                      onClick={() => handleReorder(order)}
                    >
                      Pesan Lagi
                    </button>
                  )}

                  {isFailed && (
                    <span className="failed-note">
                      Pesanan tidak dapat dilanjutkan
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div className="pagination">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            className={currentPage === i + 1 ? "active" : ""}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
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
