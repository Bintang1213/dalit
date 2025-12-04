// KelolaVoucher.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./kelolavoucher.css";

const KelolaVoucher = () => {
  const [vouchers, setVouchers] = useState([]);

  // State form tambah
  const [title, setTitle] = useState("");
  const [discountType, setDiscountType] = useState("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [minPurchase, setMinPurchase] = useState("");
  const [maxUsagePerUser, setMaxUsagePerUser] = useState("");
  const [maxUsagePerDay, setMaxUsagePerDay] = useState("");
  const [autoApply, setAutoApply] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [remaining, setRemaining] = useState("");

  // 🔥 FIX: Token harus authToken, bukan token
  const token = localStorage.getItem("authToken");

  console.log("Token dari localStorage:", token); // Debugging

  const resetForm = () => {
    setTitle("");
    setDiscountType("percent");
    setDiscountValue("");
    setMinPurchase("");
    setMaxUsagePerUser("");
    setMaxUsagePerDay("");
    setAutoApply(false);
    setStartDate("");
    setEndDate("");
    setRemaining("");
  };

  const fetchVoucherUsage = async () => {
    try {
      console.log("Fetch dengan token:", token); // Debugging

      const res = await axios.get("http://localhost:4000/api/vouchers/admin", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setVouchers(res.data);
    } catch (err) {
      console.error("Gagal ambil voucher:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchVoucherUsage();
    // eslint-disable-next-line
  }, []);

  const handleAddVoucher = async () => {
    if (!discountValue || !startDate || !endDate) {
      alert("Lengkapi semua field wajib!");
      return;
    }
    try {
      await axios.post(
        "http://localhost:4000/api/vouchers",
        {
          title,
          discountType,
          discountValue: Number(discountValue),
          minPurchase: Number(minPurchase) || 0,
          maxUsagePerUser: Number(maxUsagePerUser) || 1,
          maxUsagePerDay: Number(maxUsagePerDay) || 0,
          autoApply,
          startDate,
          endDate,
          remaining: remaining === "" ? -1 : Number(remaining),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchVoucherUsage();
      resetForm();
    } catch (err) {
      console.error("Tambah voucher error:", err.response?.data || err.message);
      alert("Gagal menambahkan voucher");
    }
  };

  const handleDeleteVoucher = async (id) => {
    if (window.confirm("Yakin ingin menghapus voucher ini?")) {
      try {
        await axios.delete(`http://localhost:4000/api/vouchers/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchVoucherUsage();
      } catch (err) {
        console.error("Hapus voucher error:", err.response?.data || err.message);
      }
    }
  };

  // Format tanggal DD/MM/YYYY
  const formatTanggal = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="main-content">
      <div className="voucher-container">
        <h2>Kelola Voucher</h2>

        {/* Form tambah */}
        <div className="voucher-form">
          <input
            type="text"
            placeholder="Judul (opsional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value)}
          >
            <option value="percent">Persentase (%)</option>
            <option value="amount">Nominal (Rp)</option>
          </select>

          <input
            type="number"
            placeholder="Nilai Diskon"
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
          />

          <input
            type="number"
            placeholder="Minimal Belanja"
            value={minPurchase}
            onChange={(e) => setMinPurchase(e.target.value)}
          />

          <input
            type="number"
            placeholder="Maks. Pemakaian/User"
            value={maxUsagePerUser}
            onChange={(e) => setMaxUsagePerUser(e.target.value)}
          />

          <input
            type="number"
            placeholder="Maks. Pemakaian/Hari (0 = unlimited)"
            value={maxUsagePerDay}
            onChange={(e) => setMaxUsagePerDay(e.target.value)}
          />

          <input
            type="number"
            placeholder="Remaining global (-1 = unlimited)"
            value={remaining}
            onChange={(e) => setRemaining(e.target.value)}
          />

          <label className="checkbox">
            <input
              type="checkbox"
              checked={autoApply}
              onChange={(e) => setAutoApply(e.target.checked)}
            />
            Auto Apply
          </label>

          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

          <button onClick={handleAddVoucher} className="btn-add">
            Tambah Voucher
          </button>
        </div>

        {/* Tabel voucher */}
        <table className="voucher-table">
          <thead>
            <tr>
              <th>Judul</th>
              <th>Jenis Diskon</th>
              <th>Nilai Diskon</th>
              <th>Minimal Belanja</th>
              <th>Maks. User</th>
              <th>Maks. Per Hari</th>
              <th>Remaining</th>
              <th>Auto Apply</th>
              <th>Tanggal Mulai</th>
              <th>Tanggal Berakhir</th>
              <th>Sisa Hari Ini</th>
              <th>Aksi</th>
            </tr>
          </thead>

          <tbody>
            {vouchers.length > 0 ? (
              vouchers.map((v) => (
                <tr key={v._id}>
                  <td>{v.title || "-"}</td>
                  <td>{v.discountType === "percent" ? "Persentase (%)" : "Nominal (Rp)"}</td>
                  <td>
                    {v.discountType === "percent"
                      ? `${v.discountValue}%`
                      : `Rp ${v.discountValue}`}
                  </td>
                  <td>Rp {v.minPurchase}</td>
                  <td>{v.maxUsagePerUser ?? "-"}</td>
                  <td>{v.maxUsagePerDay === 0 ? "Unlimited" : v.maxUsagePerDay ?? "-"}</td>
                  <td>{v.remaining >= 0 ? v.remaining : "Unlimited"}</td>
                  <td>{v.autoApply ? "Ya" : "Tidak"}</td>
                  <td>{formatTanggal(v.startDate)}</td>
                  <td>{formatTanggal(v.endDate)}</td>
                  <td>{v.sisaHariIni ?? "-"}</td>
                  <td>
                    <button onClick={() => handleDeleteVoucher(v._id)} className="btn-delete">
                      Hapus
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="12" style={{ textAlign: "center" }}>
                  Belum ada voucher
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default KelolaVoucher;
