import React, { useContext, useEffect } from 'react';
import './FoodItem.css';
import { assets } from '../../assets/assets';
import { StoreContext } from '../../context/StoreContext';
import { LazyLoadImage } from 'react-lazy-load-image-component';

const FoodItem = ({ id, name, price, description, image }) => {
  const { cartItems, addToCart, removeFromCart, url } = useContext(StoreContext);

  return (
    <div className='food-item'>
      <div className="food-item-img-container">
        {/* Perbaikan: Mengganti LazyLoadImagAe menjadi LazyLoadImage */}
        <LazyLoadImage className='food-item-image' src={url + "/images/" + image} alt={name} effect="blur" />
        {!cartItems[id] ? (
          <img className='add' onClick={() => addToCart(id)} src={assets.add_icon_white} alt="" />
        ) : (
          <div className='food-item-counter'>
            <img onClick={() => removeFromCart(id)} src={assets.remove_icon_red} alt="" />
            <p>{cartItems[id]}</p>
            <img onClick={() => addToCart(id)} src={assets.add_icon_green} alt="" />
          </div>
        )}
      </div>
      <div className="food-item-info">
        {name}
        <p className="food-item-desc">{description}</p>
        <p className="food-item-price">Rp. {price}</p>
      </div>
    </div>
  );
}

export default FoodItem;