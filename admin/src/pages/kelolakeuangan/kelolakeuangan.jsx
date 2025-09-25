import React, { useState, useEffect } from 'react';
import Axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './kelolakeuangan.css';

const KelolaKeuangan = () => {
  const [orderData, setOrderData] = useState([]);
  const [totalPemasukan, setTotalPemasukan] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const res = await Axios.get('http://localhost:4000/api/order', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success && Array.isArray(res.data.data)) {
          setOrderData(res.data.data);
        } else {
          throw new Error("Format data tidak valid");
        }
      } catch (err) {
        console.error('Gagal ambil data order:', err);
        setError('Gagal mengambil data. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

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

  useEffect(() => {
    const filtered = filterTransaksi();
    calculateTotalPemasukan(filtered);
  }, [startDate, endDate, orderData]);

  const filteredOrders = filterTransaksi();

  const flattenedData = [];
  filteredOrders.forEach((order, orderIndex) => {
    if (Array.isArray(order.items)) {
      order.items.forEach((item, itemIndex) => {
        const price = parseInt(item.price) || 0;
        const quantity = parseInt(item.quantity) || 0;
        flattenedData.push({
          orderIndex,
          orderId: order._id,
          orderDate: order.createdAt,
          itemId: item._id,
          itemName: item.name,
          itemPrice: price,
          itemQuantity: quantity,
          itemTotal: price * quantity,
          itemCount: order.items.length,
          itemIndex,
        });
      });
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

const handleUnduhPDF = () => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  const title = "Laporan Keuangan Kedai Wartiyem";
  doc.setFontSize(18);
  doc.setTextColor(220, 0, 0);
  doc.setFont(undefined, 'bold');
  const textWidth = doc.getTextWidth(title);
  doc.text(title, (pageWidth - textWidth) / 2, 15);

  // Periode
  if (startDate && endDate) {
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    const periodeText = `Periode: ${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}`;
    doc.text(periodeText, 14, 22);
  }

  // Tabel data pesanan
  const tableData = [];
  let no = 1;
  let total = 0;
  flattenedData.forEach((item) => {
    tableData.push([
      no,
      new Date(item.orderDate).toLocaleDateString('id-ID'),
      item.itemName,
      `Rp ${item.itemPrice.toLocaleString()}`,
      item.itemQuantity,
      `Rp ${item.itemTotal.toLocaleString()}`
    ]);
    total += item.itemTotal;
    no++;
  });

  autoTable(doc, {
    startY: 28,
    head: [["No", "Tanggal", "Pesanan", "Harga Per Item", "Jumlah", "Total"]],
    body: tableData,
    styles: { fontSize: 10 },
    headStyles: {
      fillColor: [255, 0, 0],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [255, 230, 230] },
    margin: { left: 14, right: 14 },
  });

  // Hitung posisi akhir tabel pertama
  const afterTableY = doc.lastAutoTable.finalY || 35;

  // Total pemasukan
  autoTable(doc, {
    startY: afterTableY + 5,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    head: [['', '', '', '', 'Total Pemasukan', `Rp ${total.toLocaleString()}`]],
    headStyles: {
      fillColor: [255, 200, 200],
      textColor: [150, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
    },
    body: [],
    styles: {
      fontSize: 14,
      cellPadding: 4,
    },
    columnStyles: {
      4: { halign: 'right', fontStyle: 'bold' },
      5: { halign: 'right', fontStyle: 'bold' },
    },
  });

  const afterTotalY = doc.lastAutoTable.finalY || (afterTableY + 10);

// Ambil tanggal hari ini
const today = new Date();
const day = today.getDate();
const month = today.toLocaleString('id-ID', { month: 'long' });
const year = today.getFullYear();

const tanggalCetak = `Indramayu,${day} ${month} ${year}`;

// Tentukan posisi tulisan tanggal, di atas tanda tangan
const tanggalY = afterTotalY + 20;
const tanggalX = pageWidth - 70;

doc.setFontSize(11);
doc.setTextColor(0, 0, 0);
doc.setFont(undefined, 'bold');
// Tulis tanggal otomatis
doc.text(tanggalCetak, tanggalX, tanggalY);

// Kemudian tanda tangan
const ttdY = tanggalY + 5;
const ttdX = pageWidth - 70;

doc.text("Mengetahui,", ttdX, ttdY);
doc.text("Manajer Keuangan", ttdX, ttdY + 5);
doc.text("(_________________)", ttdX, ttdY + 40);


  doc.save("laporan-keuangan.pdf");
};

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="container-keuangan">
      <div className="kelola-keuangan-header">
        <h2>Laporan Keuangan</h2>
        <div className="filter-kategori" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label>
            Dari:
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ marginLeft: 5 }} />
          </label>
          <label>
            Sampai:
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ marginLeft: 5 }} />
          </label>
        </div>
      </div>

      <div className="table-container">
        <table className="tabel-keuangan">
          <thead>
            <tr>
              <th>No</th>
              <th>Tanggal</th>
              <th>Pesanan</th>
              <th>Harga Per Item</th>
              <th>Jumlah</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {currentData.length > 0 ? (
              <>
                {currentData.map((item) => (
                  <tr key={`${item.orderId}-${item.itemId}`}>
                    {item.itemIndex === 0 && (
                      <>
                        <td rowSpan={item.itemCount}>{item.orderIndex + 1}</td>
                        <td rowSpan={item.itemCount}>{new Date(item.orderDate).toLocaleDateString('id-ID')}</td>
                      </>
                    )}
                    <td>{item.itemName}</td>
                    <td>Rp {item.itemPrice.toLocaleString()}</td>
                    <td>{item.itemQuantity}</td>
                    <td>Rp {item.itemTotal.toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td colSpan="5" style={{ textAlign: 'right', fontWeight: 'bold' }}>Total Pemasukan:</td>
                  <td style={{ fontWeight: 'bold' }}>Rp {totalPemasukan.toLocaleString()}</td>
                </tr>
              </>
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center' }}>Tidak ada data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-controls">
        <span className="pagination-arrow" onClick={handlePrevPage}>&lt;</span>
        <span className="page-number">Halaman {currentPage} dari {totalPages}</span>
        <span className="pagination-arrow" onClick={handleNextPage}>&gt;</span>
      </div>

      <div className="download-button-container">
        <button onClick={handleUnduhPDF} className="download-button">
          Unduh Laporan Keuangan
        </button>
      </div>
    </div>
  );
};

export default KelolaKeuangan;