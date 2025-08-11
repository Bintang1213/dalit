import React, { useContext, useEffect } from 'react';
import { StoreContext } from "../../context/StoreContext";
import FoodItem from "../../components/FoodItem/FoodItem";
import './Menu.css';

const Menu = () => {
  const { food_list, setLoading } = useContext(StoreContext);

  // Simulasi proses load data menu
  useEffect(() => {
    setLoading(true); // mulai loading
    // misalnya proses fetch data dari API
    setTimeout(() => {
      setLoading(false); // selesai loading
    }, 1000); // delay 1 detik
  }, [setLoading]);

  // Ambil kategori unik dari data menu
  const categories = [...new Set(food_list.map(item => item.category))];

  return (
    <div className="menu-container">
      {categories.map((category, idx) => {
        const items = food_list.filter(item => item.category === category);

        return (
          <div key={idx} className="menu-category-section">
            <h2 className="menu-category-title">{category}</h2>
            <div className="menu-category-line"></div>
            <div className="menu-items">
              {items.map((item) => (
                <FoodItem
                  key={item._id}
                  id={item._id}
                  name={item.name}
                  description={item.description}
                  price={item.price}
                  image={item.image}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Menu;
