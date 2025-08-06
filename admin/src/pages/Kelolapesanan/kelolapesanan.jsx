import React, { useState, useEffect } from "react";
import Axios from "axios";
import { useNavigate } from "react-router-dom";
import "./kelolapesanan.css";

const KelolaPesanan = () => {
  const [pesanan, setPesanan] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(pesanan.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPesanan = pesanan.slice(indexOfFirstItem, indexOfLastItem);

  const getOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return navigate("/login");

      const response = await Axios.get("http://localhost:4000/api/order", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setPesanan(response.data.data || response.data);
      setStatusMessage("");
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        setError("Sesi Anda telah berakhir. Silakan login kembali.");
        localStorage.removeItem("authToken");
        navigate("/login");
      } else {
        setError(error.response?.data?.message || "Gagal mengambil data.");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("Anda perlu login.");
        return navigate("/login");
      }

      await Axios.patch(
        `http://localhost:4000/api/order/${selectedOrderId}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setStatusMessage(`Status berhasil diubah menjadi ${status}`);
      setIsModalOpen(false);
      getOrders();
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        setError("Sesi Anda telah berakhir. Silakan login kembali.");
        localStorage.removeItem("authToken");
        navigate("/login");
      } else {
        setError(error.response?.data?.message || "Gagal memperbarui status.");
      }
    }
  };

  const openModal = (orderId, status) => {
    setSelectedOrderId(orderId);
    setSelectedStatus(status);
    setIsModalOpen(true);
    setError(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError(null);
  };

  useEffect(() => {
    getOrders();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <p>Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="container-pesanan">
      <h1 className="judul">Kelola Pesanan</h1>

      {statusMessage && <div className="success-message">✓ {statusMessage}</div>}
      {error && <div className="error-message">❗ {error}</div>}

      <div className="table-container">
        <table className="tabel-pesanan">
          <thead>
            <tr>
              <th>No</th>
              <th>Tanggal</th>
              <th>Pesanan</th>
              <th>Harga</th>
              <th>Jumlah</th>
              <th>Total</th>
              <th>Layanan</th>
              <th>Metode</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {currentPesanan.length > 0 ? (
              currentPesanan.map((order, index) => (
                <tr key={order._id}>
                  <td>{indexOfFirstItem + index + 1}</td>
                  <td>{new Date(order.createdAt).toLocaleString()}</td>
                  <td>{order.items.map((item) => (
                    <div key={item._id}>{item.name}</div>
                  ))}</td>
                  <td>{order.items.map((item) => (
                    <div key={item._id}>Rp {item.price.toLocaleString()}</div>
                  ))}</td>
                  <td>{order.items.map((item) => (
                    <div key={item._id}>{item.quantity}</div>
                  ))}</td>
                  <td>Rp {order.totalAmount.toLocaleString()}</td>
                  <td>{order.method}</td>
                  <td>{order.payment}</td>
                  <td className={`status-${order.status.toLowerCase()}`}>{order.status}</td>
                  <td className="aksi">
                    <button
                      onClick={() => openModal(order._id, "Menunggu")}
                      className="status-button menunggu"
                    >
                      Menunggu
                    </button>
                    <button
                      onClick={() => openModal(order._id, "Diproses")}
                      className="status-button diproses"
                    >
                      Diproses
                    </button>
                    <button
                      onClick={() => openModal(order._id, "Selesai")}
                      className="status-button selesai"
                    >
                      Selesai
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10">Tidak ada pesanan</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination seperti KelolaMenu */}
      <div className="pagination-controls">
        <span
          className="pagination-arrow"
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
        >
          &lt;
        </span>
        <span>
          halaman {currentPage} dari {totalPages}
        </span>
        <span
          className="pagination-arrow"
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
        >
          &gt;
        </span>
      </div>

      {/* Modal Konfirmasi */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>
              Ubah status ke{" "}
              <span className={`status-${selectedStatus.toLowerCase()}`}>
                {selectedStatus}
              </span>
              ?
            </h2>
            <div className="modal-buttons">
              <button className="confirm-btn" onClick={() => updateStatus(selectedStatus)}>
                Ya
              </button>
              <button className="cancel-btn" onClick={closeModal}>
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KelolaPesanan;
