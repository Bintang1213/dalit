import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './kelolapengguna.css';

const KelolaPengguna = () => {
  const [pengguna, setPengguna] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 5;
  const totalPages = Math.ceil(pengguna.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = pengguna.slice(startIndex, startIndex + itemsPerPage);

  const getPengguna = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/user/all");
      if (res.data.success) {
        setPengguna(res.data.data);
      } else {
        alert("Gagal mengambil data pengguna");
      }
    } catch (error) {
      console.error("Error mengambil data pengguna:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleHapus = async (id) => {
    const konfirmasi = window.confirm('Yakin ingin menghapus pengguna ini?');
    if (konfirmasi) {
      try {
        const res = await axios.delete(`http://localhost:4000/api/user/${id}`);
        if (res.data.success) {
          const updated = pengguna.filter(user => user._id !== id);
          setPengguna(updated);

          const lastPageItemCount = updated.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).length;
          if (lastPageItemCount === 0 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
          }
        } else {
          alert("Gagal menghapus pengguna");
        }
      } catch (error) {
        console.error("Terjadi kesalahan saat menghapus pengguna:", error);
        alert("Terjadi kesalahan saat menghapus pengguna");
      }
    }
  };

  useEffect(() => {
    getPengguna();
  }, []);

  return (
    <div className="container-pengguna">
      <div className="kelola-pengguna-header">
        <h2>Kelola Pengguna</h2>
      </div>

      <table className="kelola-pengguna-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Nama</th>
            <th>Email</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="4" style={{ textAlign: 'center' }}>Memuat data...</td></tr>
          ) : currentItems.length > 0 ? (
            currentItems.map((user, index) => (
              <tr key={user._id}>
                <td>{startIndex + index + 1}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <button className="btn-hapus" onClick={() => handleHapus(user._id)}>
                    Hapus
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="4" style={{ textAlign: 'center' }}>Tidak ada pengguna</td></tr>
          )}
        </tbody>
      </table>

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
    </div>
  );
};

export default KelolaPengguna;
