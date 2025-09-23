import React, { useContext } from 'react';
import './FoodItem.css';
import { StoreContext } from '../../context/StoreContext';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { FaPlus, FaMinus, FaStar } from 'react-icons/fa';  // ⭐ ditambah
import { toast } from 'react-toastify';

const FoodItem = ({ id, name, price, description, image, status, rating }) => {
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

        {/* ⭐ Badge Rating */}
        {rating !== undefined && (
          <div className="food-rating-badge">
            <FaStar className="star-icon" />
            <span>{rating > 0 ? rating.toFixed(1) : "-"}</span>
          </div>
        )}

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
            {statusText}
          </span>
        </p>
      </div>
    </div>
  );
};

export default FoodItem;
