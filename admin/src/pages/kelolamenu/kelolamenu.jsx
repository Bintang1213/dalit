import React, { useEffect, useState } from 'react';
import './kelolamenu.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import Add from '../Add/Add'; // Pastikan path-nya sesuai

const Kelolamenu = ({ url }) => {
  const [list, setList] = useState([]);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [foodIdToDelete, setFoodIdToDelete] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [showEditPopup, setShowEditPopup] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(list.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = list.slice(startIndex, startIndex + itemsPerPage);

  const fetchList = async () => {
    try {
      const response = await axios.get(`${url}/api/food/list`);
      if (response.data.succes) {
        setList(response.data.data);
      } else {
        toast.error("Error");
      }
    } catch (err) {
      toast.error("Gagal mengambil data menu.");
    }
  };

  const removeFood = async (foodId) => {
    try {
      const response = await axios.post(`${url}/api/food/remove`, { id: foodId });
      if (response.data.succes) {
        toast.success(response.data.message);
        fetchList();
      } else {
        toast.error("Error");
      }
    } catch (err) {
      toast.error("Gagal menghapus menu.");
    }
  };

  const handleDeleteClick = (foodId) => {
    setFoodIdToDelete(foodId);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    removeFood(foodIdToDelete);
    setShowDeleteModal(false);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleEditClick = (item) => {
    setEditItem(item);
    setShowEditPopup(true);
  };

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <div className='kelola-menu-content'>
      <div className="kelola-menu-header">
        <h1>Kelola Menu</h1>
        <button onClick={() => setShowAddPopup(true)}>+ Tambah Menu</button>
      </div>

      <table className='kelola-menu-table'>
        <thead>
          <tr>
            <th>Gambar</th>
            <th>Nama</th>
            <th>Kategori</th>
            <th>Harga</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((item, index) => (
            <tr key={index}>
              <td><img src={`${url}/images/${item.image}`} alt={item.name} /></td>
              <td>{item.name}</td>
              <td>{item.category}</td>
              <td>{item.price}</td>
              <td className='aksi-buttons'>
                <button onClick={() => handleEditClick(item)} className="edit-btn">Edit</button>
                <button onClick={() => handleDeleteClick(item._id)} className="delete-btn">Hapus</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="pagination-controls">
        <span
          className="pagination-arrow"
          onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
        >
          &lt;
        </span>
        <span>halaman {currentPage} dari {totalPages}</span>
        <span
          className="pagination-arrow"
          onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
        >
          &gt;
        </span>
      </div>

      {/* Popup Tambah */}
      {showAddPopup && (
        <Add
          url={url}
          onClose={() => {
            setShowAddPopup(false);
            fetchList();
          }}
        />
      )}

      {/* Popup Edit */}
      {showEditPopup && (
        <Add
          url={url}
          editData={editItem}
          onClose={() => {
            setShowEditPopup(false);
            setEditItem(null);
            fetchList();
          }}
        />
      )}

      {/* Modal Konfirmasi Hapus */}
      {showDeleteModal && (
        <div className="delete-modal">
          <div className="delete-modal-content">
            <p>Apakah Anda yakin ingin menghapus menu ini?</p>
            <div className="delete-modal-buttons">
              <button onClick={confirmDelete}>Ya, Hapus</button>
              <button onClick={cancelDelete}>Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Kelolamenu;