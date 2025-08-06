import React, { useContext, useEffect, useRef } from 'react';
import './FoodDisplay.css';
import { StoreContext } from '../../context/StoreContext';
import FoodItem from '../FoodItem/FoodItem';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const FoodDisplay = ({ category }) => {
  const { food_list } = useContext(StoreContext);
  const listRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(listRef.current, 
      { opacity: 0, y: 50 }, 
      {
        opacity: 1, y: 0, duration: 0.8, 
        scrollTrigger: {
          trigger: listRef.current,
          start: "top 80%",
          toggleActions: "play none none none"
        }
      }
    );
  }, []);

  return (
    <div className='food-display' id='food-display'>
      <h2>Hidangan Terbaik di Dekat Anda</h2>
      <div className="food-display-list" ref={listRef}>
        {food_list.map((item, index) => (
          (category === "All" || category === item.category) && (
            <FoodItem key={index} id={item._id} name={item.name} description={item.description} price={item.price} image={item.image} />
          )
        ))}
      </div>
    </div>
  );
};

export default FoodDisplay;
