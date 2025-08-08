import React, { useContext } from 'react';
import './FoodItem.css';
import { StoreContext } from '../../context/StoreContext';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { FaPlus, FaMinus } from 'react-icons/fa'; // <-- Tambahkan ini

const FoodItem = ({ id, name, price, description, image }) => {
  const { cartItems, addToCart, removeFromCart, url } = useContext(StoreContext);

  return (
    <div className='food-item'>
      <div className="food-item-img-container">
        <LazyLoadImage className='food-item-image' src={url + "/images/" + image} alt={name} effect="blur" />
        {!cartItems[id] ? (
          <div className='add-icon-wrapper' onClick={() => addToCart(id)}>
            <FaPlus className='add-icon' />
          </div>
        ) : (
          <div className='food-item-counter'>
            <FaMinus className='counter-icon minus' onClick={() => removeFromCart(id)} />
            <p>{cartItems[id]}</p>
            <FaPlus className='counter-icon plus' onClick={() => addToCart(id)} />
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
