import React, { useContext } from 'react';
import './FoodItem.css';
import { StoreContext } from '../../context/StoreContext';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { FaPlus, FaMinus } from 'react-icons/fa';
import { toast } from 'react-toastify';

const FoodItem = ({ id, name, price, description, image }) => {
  const { cartItems, addToCart, removeFromCart, url } = useContext(StoreContext);

  const handleAdd = () => {
    addToCart(id);
    // Gunakan toast ID unik agar tidak menumpuk untuk menu yang sama
    toast.success(`${name} berhasil ditambahkan ke keranjang!`, {
      toastId: `add-${id}`,
      position: "top-right",
      autoClose: 2000,
      pauseOnHover: true,
      hideProgressBar: false,
      closeOnClick: true,
      draggable: true,
    });
  };

  const handleRemove = () => {
    removeFromCart(id);
    toast.info(`${name} dikurangi dari keranjang`, {
      toastId: `remove-${id}`,
      position: "top-right",
      autoClose: 2000,
      pauseOnHover: true,
      hideProgressBar: false,
      closeOnClick: true,
      draggable: true,
    });
  };

  return (
    <div className='food-item'>
      <div className="food-item-img-container">
        <LazyLoadImage
          className='food-item-image'
          src={url + "/images/" + image}
          alt={name}
          effect="blur"
        />

        {!cartItems[id] ? (
          <div className='add-icon-wrapper' onClick={handleAdd}>
            <FaPlus className='add-icon' />
          </div>
        ) : (
          <div className='food-item-counter'>
            <FaMinus className='counter-icon minus' onClick={handleRemove} />
            <p>{cartItems[id]}</p>
            <FaPlus className='counter-icon plus' onClick={handleAdd} />
          </div>
        )}
      </div>

      <div className="food-item-info">
        <p className="food-item-name">{name}</p>
        <p className="food-item-desc">{description}</p>
        <p className="food-item-price">Rp. {price}</p>
      </div>
    </div>
  );
}

export default FoodItem;
