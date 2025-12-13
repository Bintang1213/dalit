import React, { useState, useEffect } from "react";
import Axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./kelolakeuangan.css";

const KelolaKeuangan = () => {
  const [orderData, setOrderData] = useState([]);
  const [totalPemasukan, setTotalPemasukan] = useState(0);
  const [menuTerlaris, setMenuTerlaris] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [filterMode, setFilterMode] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const res = await Axios.get("http://localhost:4000/api/order", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success && Array.isArray(res.data.data)) {
          setOrderData(res.data.data);
        } else {
          throw new Error("Format data tidak valid");
        }
      } catch (err) {
        console.error("Gagal ambil data order:", err);
        setError("Gagal mengambil data. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const applyQuickFilter = (mode) => {
    setFilterMode(mode);

    const today = new Date();

    if (mode === "day") {
      const d = today.toISOString().split("T")[0];
      setStartDate(d);
      setEndDate(d);
    } else if (mode === "all") {
      setStartDate("");
      setEndDate("");
      setSelectedMonth("");
      setSelectedYear("");
    }
  };

  const applyMonthDropdown = (month) => {
    if (!month) return;
    const now = new Date();
    const year = now.getFullYear();
    const first = new Date(year, month - 1, 1).toISOString().split("T")[0];
    const last = new Date(year, month, 0).toISOString().split("T")[0];

    setStartDate(first);
    setEndDate(last);
  };

  const applyYearDropdown = (year) => {
    if (!year) return;
    setStartDate(`${year}-01-01`);
    setEndDate(`${year}-12-31`);
  };

  const filterTransaksi = () => {
    return orderData.filter((order) => {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return orderDate >= start && orderDate <= end;
      }
      return true;
    });
  };

  const calculateTotalPemasukan = (filteredOrders) => {
    let total = 0;
    filteredOrders.forEach((order) => {
      if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          const price = parseInt(item.price) || 0;
          const qty = parseInt(item.quantity) || 0;
          total += price * qty;
        });
      }
    });
    setTotalPemasukan(total);
  };

  const calculateMenuTerlaris = (filteredOrders) => {
    const menuCount = {};
    filteredOrders.forEach((order) => {
      if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          const qty = parseInt(item.quantity) || 0;
          menuCount[item.name] = (menuCount[item.name] || 0) + qty;
        });
      }
    });

    let maxMenu = null;
    let maxQty = 0;

    for (const [name, qty] of Object.entries(menuCount)) {
      if (qty > maxQty) {
        maxMenu = name;
        maxQty = qty;
      }
    }

    setMenuTerlaris(maxMenu ? { name: maxMenu, quantity: maxQty } : null);
  };

  useEffect(() => {
    const filtered = filterTransaksi();
    calculateTotalPemasukan(filtered);
    calculateMenuTerlaris(filtered);
  }, [startDate, endDate, orderData]);

  const filteredOrders = filterTransaksi();

  const flattenedData = [];
  let orderNumber = 1;

  filteredOrders.forEach((order) => {
    if (Array.isArray(order.items)) {
      const paymentMethod = order.paymentMethod || "Tunai";

      order.items.forEach((item) => {
        flattenedData.push({
          orderId: order._id,
          orderNumber,
          orderDate: order.createdAt,
          paymentMethod,
          itemId: item._id,
          itemName: item.name,
          itemPrice: parseInt(item.price) || 0,
          itemQuantity: parseInt(item.quantity) || 0,
          itemTotal:
            (parseInt(item.price) || 0) * (parseInt(item.quantity) || 0),
        });
      });

      orderNumber++;
    }
  });

  const totalPages = Math.ceil(flattenedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = flattenedData.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const rowSpanMap = {};
  currentData.forEach((item) => {
    if (!rowSpanMap[item.orderId]) {
      rowSpanMap[item.orderId] = currentData.filter(
        (d) => d.orderId === item.orderId
      ).length;
    }
  });

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  };

  const handleUnduhPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.setTextColor(220, 0, 0);
    doc.setFont(undefined, "bold");

    const title = "Laporan Keuangan Kedai Wartiyem";
    const textWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - textWidth) / 2, 15);

    if (startDate && endDate) {
      doc.setFontSize(12);
      doc.text(
        `Periode: ${new Date(startDate).toLocaleDateString(
          "id-ID"
        )} - ${new Date(endDate).toLocaleDateString("id-ID")}`,
        14,
        22
      );
    }

    const tableData = flattenedData.map((item) => [
      item.orderNumber,
      new Date(item.orderDate).toLocaleDateString("id-ID"),
      item.itemName,
      item.paymentMethod,
      `Rp ${item.itemPrice.toLocaleString()}`,
      item.itemQuantity,
      `Rp ${item.itemTotal.toLocaleString()}`,
    ]);

    autoTable(doc, {
      startY: 28,
      head: [
        ["No", "Tanggal", "Pesanan", "Metode", "Harga", "Jumlah", "Total"],
      ],
      body: tableData,
    });

    doc.save("laporan-keuangan.pdf");
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="main-content">
      <div className="container-keuangan">
        <div className="kelola-keuangan-header">
          <h2>Laporan Keuangan</h2>

          <div className="filter-kategori">
            <label>
              Dari:
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setFilterMode("all");
                }}
              />
            </label>

            <label>
              Sampai:
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setFilterMode("all");
                }}
              />
            </label>
          </div>
        </div>

        <div className="filter-buttons">
          <button
            className="btn-filter"
            onClick={() => applyQuickFilter("day")}
          >
            Hari Ini
          </button>

          <button
            className="btn-filter"
            onClick={() => applyQuickFilter("all")}
          >
            Semua
          </button>

          <select
            className="dropdown-filter"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              applyMonthDropdown(parseInt(e.target.value));
            }}
          >
            <option value="">Pilih Bulan</option>
            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString("id-ID", {
                  month: "long",
                })}
              </option>
            ))}
          </select>

          <select
            className="dropdown-filter"
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value);
              applyYearDropdown(e.target.value);
            }}
          >
            <option value="">Pilih Tahun</option>
            {[2023, 2024, 2025, 2026, 2027].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="table-container">
          <table className="tabel-keuangan">
            <thead>
              <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Pesanan</th>
                <th>Metode</th>
                <th>Harga</th>
                <th>Jumlah</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>
              {currentData.length > 0 ? (
                <>
                  {currentData.map((item, i) => {
                    const isFirst =
                      i === 0 ||
                      currentData[i - 1].orderId !== item.orderId;

                    return (
                      <tr
                        key={`${item.orderId}-${item.itemId}`}
                      >
                        {isFirst && (
                          <>
                            <td rowSpan={rowSpanMap[item.orderId]}>
                              {item.orderNumber}
                            </td>
                            <td rowSpan={rowSpanMap[item.orderId]}>
                              {new Date(item.orderDate).toLocaleDateString(
                                "id-ID"
                              )}
                            </td>
                          </>
                        )}

                        <td>{item.itemName}</td>
                        <td>{item.paymentMethod}</td>
                        <td>
                          Rp {item.itemPrice.toLocaleString()}
                        </td>
                        <td>{item.itemQuantity}</td>
                        <td>
                          Rp {item.itemTotal.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}

                  <tr className="total-row">
                    <td
                      colSpan="6"
                      style={{
                        textAlign: "right",
                        fontWeight: "bold",
                      }}
                    >
                      Total Pemasukan:
                    </td>
                    <td style={{ fontWeight: "bold" }}>
                      Rp {totalPemasukan.toLocaleString()}
                    </td>
                  </tr>

                  {menuTerlaris && (
                    <tr className="menu-terlaris-row">
                      <td colSpan="7" style={{ textAlign: "center" }}>
                        🍽️ Menu Terlaris: {menuTerlaris.name} (
                        {menuTerlaris.quantity}x)
                      </td>
                    </tr>
                  )}
                </>
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>
                    Tidak ada data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination-controls">
          <span
            className="pagination-arrow"
            onClick={handlePrevPage}
          >
            &lt;
          </span>
          <span className="page-number">
            Halaman {currentPage} dari {totalPages}
          </span>
          <span
            className="pagination-arrow"
            onClick={handleNextPage}
          >
            &gt;
          </span>
        </div>

        <div className="download-button-container">
          <button
            onClick={handleUnduhPDF}
            className="download-button"
          >
            Unduh Laporan Keuangan
          </button>
        </div>
      </div>
    </div>
  );
};

export default KelolaKeuangan;
