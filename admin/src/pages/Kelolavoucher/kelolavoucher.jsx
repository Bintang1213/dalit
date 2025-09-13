import React, { useState, useEffect } from "react";
import axios from "axios";
import "./kelolavoucher.css";

const KelolaVoucher = () => {
  const [vouchers, setVouchers] = useState([]);

  // State form
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [minPurchase, setMinPurchase] = useState("");
  const [maxUsagePerUser, setMaxUsagePerUser] = useState("");
  const [maxDailyUsage, setMaxDailyUsage] = useState(""); // Baru: batas voucher per hari
  const [autoApply, setAutoApply] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/vouchers");
      setVouchers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddVoucher = async () => {
    if (!code || !discountValue || !startDate || !endDate) {
      alert("Lengkapi semua field wajib!");
      return;
    }
    try {
      await axios.post("http://localhost:4000/api/vouchers", {
        code,
        discountType,
        discountValue,
        minPurchase,
        maxUsagePerUser,
        maxDailyUsage, // Kirim ke backend
        autoApply,
        startDate,
        endDate,
      });
      fetchVouchers();
      // Reset form
      setCode("");
      setDiscountType("percent");
      setDiscountValue("");
      setMinPurchase("");
      setMaxUsagePerUser("");
      setMaxDailyUsage("");
      setAutoApply(false);
      setStartDate("");
      setEndDate("");
    } catch (err) {
      console.error(err);
      alert("Gagal menambahkan voucher");
    }
  };

  const handleDeleteVoucher = async (id) => {
    if (window.confirm("Yakin ingin menghapus voucher ini?")) {
      try {
        await axios.delete(`http://localhost:4000/api/vouchers/${id}`);
        fetchVouchers();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="main-content">
      <div className="voucher-container">
        <h2>Kelola Voucher</h2>

        <div className="voucher-form">
          <input
            type="text"
            placeholder="Kode Voucher"
            value={code}
            onChange={(e) => setCode(e.target.value)}
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
            value={maxDailyUsage}
            onChange={(e) => setMaxDailyUsage(e.target.value)}
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

          <button onClick={handleAddVoucher} className="btn-add">
            Tambah Voucher
          </button>
        </div>

        <table className="voucher-table">
          <thead>
            <tr>
              <th>Kode</th>
              <th>Diskon</th>
              <th>Minimal Belanja</th>
              <th>Maks. User</th>
              <th>Maks. Per Hari</th>
              <th>Auto Apply</th>
              <th>Tanggal Mulai</th>
              <th>Tanggal Berakhir</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.length > 0 ? (
              vouchers.map((v) => (
                <tr key={v._id}>
                  <td>{v.code}</td>
                  <td>
                    {v.discountType === "percent"
                      ? `${v.discountValue}%`
                      : `Rp ${v.discountValue}`}
                  </td>
                  <td>Rp {v.minPurchase}</td>
                  <td>{v.maxUsagePerUser}</td>
                  <td>{v.maxDailyUsage || "Unlimited"}</td>
                  <td>{v.autoApply ? "Ya" : "Tidak"}</td>
                  <td>{new Date(v.startDate).toLocaleDateString()}</td>
                  <td>{new Date(v.endDate).toLocaleDateString()}</td>
                  <td>
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
                <td colSpan="9" style={{ textAlign: "center" }}>
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
