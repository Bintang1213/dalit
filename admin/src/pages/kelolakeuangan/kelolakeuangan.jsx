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

  // BUTTON FILTER
  const applyQuickFilter = (mode) => {
    setFilterMode(mode);

    const today = new Date();

    if (mode === "day") {
      const d = today.toISOString().split("T")[0];
      setStartDate(d);
      setEndDate(d);
    }

    if (mode === "all") {
      setStartDate("");
      setEndDate("");
      setSelectedMonth("");
      setSelectedYear("");
    }
  };

  // FILTER BULAN DROPDOWN
  const applyMonthDropdown = (month) => {
    if (!month) return;

    const now = new Date();
    const year = now.getFullYear();

    const first = new Date(year, month - 1, 1).toISOString().split("T")[0];
    const last = new Date(year, month, 0).toISOString().split("T")[0];

    setStartDate(first);
    setEndDate(last);
  };

  // FILTER TAHUN DROPDOWN
  const applyYearDropdown = (year) => {
    if (!year) return;

    const first = `${year}-01-01`;
    const last = `${year}-12-31`;

    setStartDate(first);
    setEndDate(last);
  };

  // FILTER UTAMA
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
          const quantity = parseInt(item.quantity) || 0;
          total += price * quantity;
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
          const name = item.name;
          const qty = parseInt(item.quantity) || 0;
          menuCount[name] = (menuCount[name] || 0) + qty;
        });
      }
    });

    let maxMenu = null;
    let maxQty = 0;
    for (const [name, qty] of Object.entries(menuCount)) {
      if (qty > maxQty) {
        maxQty = qty;
        maxMenu = name;
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
        const price = parseInt(item.price) || 0;
        const quantity = parseInt(item.quantity) || 0;
        flattenedData.push({
          orderNumber,
          orderId: order._id,
          orderDate: order.createdAt,
          paymentMethod,
          itemId: item._id,
          itemName: item.name,
          itemPrice: price,
          itemQuantity: quantity,
          itemTotal: price * quantity,
        });
      });
      orderNumber++;
    }
  });

  const totalPages = Math.ceil(flattenedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = flattenedData.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // DOWNLOAD PDF
  const handleUnduhPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    const title = "Laporan Keuangan Kedai Wartiyem";
    doc.setFontSize(18);
    doc.setTextColor(220, 0, 0);
    doc.setFont(undefined, "bold");
    const textWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - textWidth) / 2, 15);

    if (startDate && endDate) {
      doc.setFontSize(12);
      const periodeText = `Periode: ${new Date(startDate).toLocaleDateString(
        "id-ID"
      )} - ${new Date(endDate).toLocaleDateString("id-ID")}`;
      doc.text(periodeText, 14, 22);
    }

    const tableData = [];
    let total = 0;
    flattenedData.forEach((item) => {
      tableData.push([
        item.orderNumber,
        new Date(item.orderDate).toLocaleDateString("id-ID"),
        item.itemName,
        item.paymentMethod,
        `Rp ${item.itemPrice.toLocaleString()}`,
        item.itemQuantity,
        `Rp ${item.itemTotal.toLocaleString()}`,
      ]);
      total += item.itemTotal;
    });

    autoTable(doc, {
      startY: 28,
      head: [
        ["No", "Tanggal", "Pesanan", "Metode Pembayaran", "Harga", "Jumlah", "Total"],
      ],
      body: tableData,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [255, 0, 0], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [255, 230, 230] },
      margin: { left: 14, right: 14 },
    });

    const afterTableY = doc.lastAutoTable.finalY || 35;

    if (menuTerlaris) {
      doc.text(
        `Menu Terlaris: ${menuTerlaris.name} (Terjual ${menuTerlaris.quantity} kali)`,
        14,
        afterTableY + 10
      );
    }

    autoTable(doc, {
      startY: afterTableY + 20,
      margin: { left: 14, right: 14 },
      head: [["", "", "", "", "", "Total Pemasukan", `Rp ${total.toLocaleString()}`]],
      headStyles: {
        fillColor: [255, 200, 200],
        textColor: [150, 0, 0],
        fontStyle: "bold",
      },
    });

    doc.save("laporan-keuangan.pdf");
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
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

      {/* FILTER CEPAT */}
      <div
        className="filter-buttons"
        style={{ marginTop: "10px", display: "flex", gap: "10px" }}
      >
        <button className="btn-filter" onClick={() => applyQuickFilter("day")}>
          Hari Ini
        </button>

        <button className="btn-filter" onClick={() => applyQuickFilter("all")}>
          Semua
        </button>

        {/* Dropdown Bulan */}
        <select
          className="dropdown-filter"
          value={selectedMonth}
          onChange={(e) => {
            setSelectedMonth(e.target.value);
            applyMonthDropdown(parseInt(e.target.value));
          }}
        >
          <option value="">Pilih Bulan</option>
          <option value="1">Januari</option>
          <option value="2">Februari</option>
          <option value="3">Maret</option>
          <option value="4">April</option>
          <option value="5">Mei</option>
          <option value="6">Juni</option>
          <option value="7">Juli</option>
          <option value="8">Agustus</option>
          <option value="9">September</option>
          <option value="10">Oktober</option>
          <option value="11">November</option>
          <option value="12">Desember</option>
        </select>

        {/* Dropdown Tahun */}
        <select
          className="dropdown-filter"
          value={selectedYear}
          onChange={(e) => {
            setSelectedYear(e.target.value);
            applyYearDropdown(e.target.value);
          }}
        >
          <option value="">Pilih Tahun</option>
          {[2023, 2024, 2025, 2026, 2027, 2028, 2029].map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* TABEL */}
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
                {currentData.map((item, index) => {
                  const isFirstItemOfOrderOnPage =
                    index === 0 || currentData[index - 1].orderId !== item.orderId;

                  const actualRowSpan = isFirstItemOfOrderOnPage
                    ? flattenedData.filter((d) => d.orderId === item.orderId).length
                    : 0;

                  return (
                    <tr key={`${item.orderId}-${item.itemId}`}>
                      {isFirstItemOfOrderOnPage && (
                        <>
                          <td rowSpan={actualRowSpan}>{item.orderNumber}</td>
                          <td rowSpan={actualRowSpan}>
                            {new Date(item.orderDate).toLocaleDateString("id-ID")}
                          </td>
                        </>
                      )}
                      <td>{item.itemName}</td>
                      <td>{item.paymentMethod}</td>
                      <td>Rp {item.itemPrice.toLocaleString()}</td>
                      <td>{item.itemQuantity}</td>
                      <td>Rp {item.itemTotal.toLocaleString()}</td>
                    </tr>
                  );
                })}

                <tr className="total-row">
                  <td colSpan="6" style={{ textAlign: "right", fontWeight: "bold" }}>
                    Total Pemasukan:
                  </td>
                  <td style={{ fontWeight: "bold" }}>
                    Rp {totalPemasukan.toLocaleString()}
                  </td>
                </tr>

                {menuTerlaris && (
                  <tr className="menu-terlaris-row">
                    <td colSpan="7" style={{ textAlign: "center" }}>
                      🍽️ Menu Terlaris: {menuTerlaris.name} (Terjual{" "}
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

      {/* PAGE CONTROL */}
      <div className="pagination-controls">
        <span className="pagination-arrow" onClick={handlePrevPage}>
          &lt;
        </span>
        <span className="page-number">
          Halaman {currentPage} dari {totalPages}
        </span>
        <span className="pagination-arrow" onClick={handleNextPage}>
          &gt;
        </span>
      </div>

      {/* DOWNLOAD */}
      <div className="download-button-container">
        <button onClick={handleUnduhPDF} className="download-button">
          Unduh Laporan Keuangan
        </button>
      </div>
    </div>
  );
};

export default KelolaKeuangan;
