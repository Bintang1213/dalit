import React, { useContext } from 'react';
import './FoodItem.css';
import { StoreContext } from '../../context/StoreContext';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { FaPlus, FaMinus } from 'react-icons/fa';
import { toast } from 'react-toastify';

const FoodItem = ({ id, name, price, description, image, status }) => {
  const { cartItems, addToCart, removeFromCart, url } = useContext(StoreContext);

  // ===== cek status aktif/nonaktif =====
  const disabledKeywords = [
    'habis', 'nonaktif', 'kosong', 'sold out', 'unavailable', 'tidak tersedia', 'off', 'disabled'
  ];

  let isActive = true;
  if (typeof status === 'boolean') {
    isActive = status;
  } else if (typeof status === 'number') {
    isActive = status === 1;
  } else if (typeof status === 'string') {
    const s = status.trim().toLowerCase();
    isActive = !disabledKeywords.some(k => s.includes(k));
  }
  
  // Tentukan teks status yang akan ditampilkan
  let statusText = status || "Tidak Diketahui";
  if (!isActive) {
    statusText = "Habis";
  } else if (typeof status === 'string' && status.trim().toLowerCase() === 'tersedia') {
    statusText = "Tersedia";
  }

  const handleAdd = () => {
    if (!isActive) {
      toast.warn(`${name} sedang tidak tersedia`, {
        toastId: `warn-${id}`,
        position: "top-right",
        autoClose: 1500,
      });
      return;
    }
    addToCart(id);
    toast.success(`${name} berhasil ditambahkan ke keranjang!`, {
      toastId: `add-${id}`,
      position: "top-right",
      autoClose: 2000,
    });
  };

  const handleRemove = () => {
    if (!isActive) return;
    removeFromCart(id);
  };

  return (
    <div className={`food-item ${!isActive ? "food-item-disabled" : ""}`}>
      <div className="food-item-img-container">
        <LazyLoadImage
          className='food-item-image'
          src={url + "/images/" + image}
          alt={name}
          effect="blur"
        />

        {!cartItems[id] ? (
          <div
            className={`add-icon-wrapper ${!isActive ? "disabled-button" : ""}`}
            onClick={isActive ? handleAdd : undefined}
          >
            <FaPlus className='add-icon' />
          </div>
        ) : (
          <div className={`food-item-counter ${!isActive ? "disabled-button" : ""}`}>
            <FaMinus
              className='counter-icon minus'
              onClick={isActive ? handleRemove : undefined}
            />
            <p>{cartItems[id]}</p>
            <FaPlus
              className='counter-icon plus'
              onClick={isActive ? handleAdd : undefined}
            />
          </div>
        )}
      </div>

      <div className="food-item-info">
        <p className="food-item-name">{name}</p>
        <p className="food-item-desc">{description}</p>
        <p className="food-item-price">Rp. {price}</p>
        <p className="food-item-status">
          Status:{" "}
          <span className={isActive ? "status-aktif" : "status-nonaktif"}>
            {/* Tampilkan teks status yang sudah diproses */}
            {statusText}
          </span>
        </p>
      </div>
    </div>
  );
};

export default FoodItem;