import React, { useState, useEffect } from "react";
import axios from "axios";
import "./kelolavoucher.css";

const KelolaVoucher = () => {
  const [vouchers, setVouchers] = useState([]);

  // State form
  const [title, setTitle] = useState("");
  const [discountType, setDiscountType] = useState("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [minPurchase, setMinPurchase] = useState("");
  const [maxUsagePerUser, setMaxUsagePerUser] = useState("");
  const [maxUsagePerDay, setMaxUsagePerDay] = useState("");
  const [autoApply, setAutoApply] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ✅ STATE EDIT
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);

  const token = localStorage.getItem("token");

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
    setIsEdit(false);
    setEditId(null);
  };

  const fetchVoucherUsage = async () => {
    try {
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
  }, []);

  // ✅ TAMBAH & UPDATE DISATUKAN
  const handleSubmitVoucher = async () => {
    if (!discountValue || !startDate || !endDate) {
      alert("Lengkapi semua field wajib!");
      return;
    }

    const payload = {
      title,
      discountType,
      discountValue: Number(discountValue),
      minPurchase: Number(minPurchase) || 0,
      maxUsagePerUser: Number(maxUsagePerUser) || 1,
      maxUsagePerDay: Number(maxUsagePerDay) || 0,
      autoApply,
      startDate,
      endDate,
    };

    try {
      if (isEdit) {
        // ✅ UPDATE
        await axios.put(
          `http://localhost:4000/api/vouchers/${editId}`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        // ✅ TAMBAH
        await axios.post("http://localhost:4000/api/vouchers", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      fetchVoucherUsage();
      resetForm();
    } catch (err) {
      console.error("Submit voucher error:", err.response?.data || err.message);
      alert("Gagal menyimpan voucher");
    }
  };

  // ✅ KLIK EDIT
  const handleEditVoucher = (v) => {
    setIsEdit(true);
    setEditId(v._id);

    setTitle(v.title || "");
    setDiscountType(v.discountType);
    setDiscountValue(v.discountValue);
    setMinPurchase(v.minPurchase);
    setMaxUsagePerUser(v.maxUsagePerUser);
    setMaxUsagePerDay(v.maxUsagePerDay);
    setAutoApply(v.autoApply);
    setStartDate(v.startDate?.slice(0, 10));
    setEndDate(v.endDate?.slice(0, 10));
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

        {/* ✅ FORM ADD / EDIT */}
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

          <label className="checkbox">
            <input
              type="checkbox"
              checked={autoApply}
              onChange={(e) => setAutoApply(e.target.checked)}
            />
            Auto Apply
          </label>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />

          <button onClick={handleSubmitVoucher} className="btn-add">
            {isEdit ? "Update Voucher" : "Tambah Voucher"}
          </button>

          {isEdit && (
            <button onClick={resetForm} className="btn-cancel">
              Batal Edit
            </button>
          )}
        </div>

        {/* ✅ TABEL */}
        <table className="voucher-table">
          <thead>
            <tr>
              <th>Judul</th>
              <th>Jenis Diskon</th>
              <th>Nilai Diskon</th>
              <th>Minimal Belanja</th>
              <th>Maks. User</th>
              <th>Maks. Per Hari</th>
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
                  <td>{v.discountType === "percent" ? "Persentase" : "Nominal"}</td>
                  <td>
                    {v.discountType === "percent"
                      ? `${v.discountValue}%`
                      : `Rp ${v.discountValue}`}
                  </td>
                  <td>Rp {v.minPurchase}</td>
                  <td>{v.maxUsagePerUser ?? "-"}</td>
                  <td>{v.maxUsagePerDay === 0 ? "Unlimited" : v.maxUsagePerDay}</td>
                  <td>{v.autoApply ? "Ya" : "Tidak"}</td>
                  <td>{formatTanggal(v.startDate)}</td>
                  <td>{formatTanggal(v.endDate)}</td>
                  <td>{v.sisaHariIni ?? "-"}</td>
                  <td>
                    <button
                      onClick={() => handleEditVoucher(v)}
                      className="btn-edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteVoucher(v._id)}
                      className="btn-delete"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="11" style={{ textAlign: "center" }}>
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
