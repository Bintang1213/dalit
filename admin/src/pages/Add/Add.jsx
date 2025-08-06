import React, { useEffect, useState } from 'react';
import './Add.css';
import { assets } from '../../assets/assets';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Add = ({ url, onClose, editData }) => {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [data, setData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Paket Nasi Liwet',
  });

  useEffect(() => {
    if (editData) {
      setData({
        name: editData.name,
        description: editData.description,
        price: editData.price,
        category: editData.category,
      });
    } else {
      setData({
        name: '',
        description: '',
        price: '',
        category: 'Paket Nasi Liwet',
      });
      setImage(null);
    }
  }, [editData]);

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmithandler = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('price', Number(data.price));
    formData.append('category', data.category);

    if (image) {
      formData.append('image', image);
    }

    try {
      let response;
      if (editData) {
        formData.append('id', editData._id);
        response = await axios.post(`${url}/api/food/edit`, formData);
      } else {
        response = await axios.post(`${url}/api/food/add`, formData);
      }

      if (response.data.success) {
        toast.success(response.data.message);
        onClose();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat menyimpan menu.");
      console.error(error);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="add" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <form onSubmit={onSubmithandler}>
          <h2 style={{ marginBottom: '20px' }}>
            {editData ? 'EDIT MENU' : 'TAMBAH MENU'}
          </h2>

          <div className="add-img-upload">
            <p>Upload Gambar</p>
            <label htmlFor="image">
              <img
                src={
                  image
                    ? URL.createObjectURL(image)
                    : editData
                    ? `${url}/images/${editData.image}`
                    : assets.upload_area
                }
                alt="upload"
              />
            </label>
            <input
              onChange={(e) => {
                const file = e.target.files[0];
                const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
                if (file && !allowedTypes.includes(file.type)) {
                  toast.error("Hanya file gambar yang diperbolehkan (jpg, jpeg, png, webp)");
                  e.target.value = null;
                  return;
                }
                setImage(file);
              }}
              type="file"
              id="image"
              hidden
              required={!editData}
            />
          </div>

          <div className="add-product-nama">
            <p>Nama Produk</p>
            <input
              onChange={onChangeHandler}
              value={data.name}
              type="text"
              name="name"
              placeholder="Masukkan nama produk"
              required
            />
          </div>

          <div className="add-product-description">
            <p>Deskripsi Produk</p>
            <textarea
              onChange={onChangeHandler}
              value={data.description}
              name="description"
              rows="6"
              placeholder="Masukkan deskripsi"
              required
            ></textarea>
          </div>

          <div className="add-category">
            <p>Kategori</p>
            <select onChange={onChangeHandler} name="category" value={data.category}>
              <option value="Paket Nasi Liwet">Paket Nasi Liwet</option>
              <option value="Aneka Lauk">Aneka Lauk</option>
              <option value="Aneka Mie">Aneka Mie</option>
              <option value="Paket Nasi Tutug">Paket Nasi Tutug</option>
              <option value="Minuman">Minuman</option>
            </select>
          </div>

          <div className="add-category-price">
            <p>Harga</p>
            <input
              onChange={onChangeHandler}
              value={data.price}
              type="number"
              name="price"
              placeholder="Rp."
              required
            />
          </div>

          <button type="submit" className="add-btn">
            {editData ? 'Simpan Perubahan' : 'Buat'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Add;