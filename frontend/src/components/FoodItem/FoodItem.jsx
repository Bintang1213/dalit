import React, { useContext } from "react";
import "./FoodItem.css";
import { StoreContext } from "../../context/StoreContext";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { FaPlus, FaMinus, FaStar } from "react-icons/fa";
import { toast } from "react-toastify";

const FoodItem = ({
  _id,
  name,
  price,
  description,
  image,
  status,
  avgRating,
  totalReviews,
  ratingCounts,
}) => {
  const { cartItems, addToCart, removeFromCart, url } =
    useContext(StoreContext);

  // Format harga internasional — ribuan pakai koma
  const formatInternational = (value) => {
    return value.toLocaleString("en-US");
  };

  // Tentukan apakah menu aktif
  const disabledKeywords = [
    "habis",
    "nonaktif",
    "kosong",
    "sold out",
    "unavailable",
    "tidak tersedia",
    "off",
    "disabled",
  ];

  const isStatusActive = (value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
      const s = value.trim().toLowerCase();
      return !disabledKeywords.some((k) => s.includes(k));
    }
    return true;
  };

  const isActive = isStatusActive(status);

  let statusText = status || "Tidak Diketahui";
  if (!isActive) {
    statusText = "Habis";
  } else if (
    typeof status === "string" &&
    status.trim().toLowerCase() === "tersedia"
  ) {
    statusText = "Tersedia";
  }

  // ⭐ Cari rating dominan
  const getDominantRating = () => {
    if (!ratingCounts || Object.keys(ratingCounts).length === 0) return null;
    let maxCount = 0;
    let dominant = 0;
    Object.entries(ratingCounts).forEach(([rate, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominant = Number(rate);
      }
    });
    return dominant;
  };

  const dominantRating = getDominantRating();

  // Tambah ke keranjang
  const handleAdd = () => {
    if (!isActive) {
      toast.warn(`${name} sedang tidak tersedia`, {
        toastId: `warn-${_id}`,
        position: "top-right",
        autoClose: 1500,
      });
      return;
    }

    addToCart(_id);
    toast.success(`${name} berhasil ditambahkan ke keranjang!`, {
      toastId: `add-${_id}`,
      position: "top-right",
      autoClose: 2000,
    });
  };

  const handleRemove = () => {
    if (!isActive) return;
    removeFromCart(_id);
  };

  return (
    <div className={`food-item ${!isActive ? "food-item-disabled" : ""}`}>
      <div className="food-item-img-container">

        {/* ⭐ Badge Rating */}
        <div className={`food-rating-badge ${!isActive ? "disabled-rating" : ""}`}>
          <FaStar className="star-icon" />

          {avgRating > 0 ? (
            <>
              <span>{avgRating.toFixed(1)}</span>
              <span className="review-count">({totalReviews})</span>
            </>
          ) : (
            <>
              <span>0.0</span>
              <span className="review-count">(0)</span>
            </>
          )}
        </div>

        <LazyLoadImage
          className="food-item-image"
          src={url + "/images/" + image}
          alt={name}
          effect="blur"
        />

        {/* 🔥 Tombol hanya muncul jika menu aktif */}
        {isActive && (
          !cartItems[_id] ? (
            <div className="add-icon-wrapper" onClick={handleAdd}>
              <FaPlus className="add-icon" />
            </div>
          ) : (
            <div className="food-item-counter">
              <FaMinus
                className="counter-icon minus"
                onClick={handleRemove}
              />
              <p>{cartItems[_id]}</p>
              <FaPlus
                className="counter-icon plus"
                onClick={handleAdd}
              />
            </div>
          )
        )}

      </div>

      <div className="food-item-info">
        <p className="food-item-name">{name}</p>
        <p className="food-item-desc">{description}</p>

        {/* Harga dengan format internasional */}
        <p className="food-item-price">
          Rp {formatInternational(price)}
        </p>

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
