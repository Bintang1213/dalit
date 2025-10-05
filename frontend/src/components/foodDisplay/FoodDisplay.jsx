import React, { useContext, useEffect, useRef } from "react";
import "./FoodDisplay.css";
import { StoreContext } from "../../context/StoreContext";
import FoodItem from "../FoodItem/FoodItem";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const FoodDisplay = ({ category }) => {
  const { food_list } = useContext(StoreContext);
  const listRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      listRef.current,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        scrollTrigger: {
          trigger: listRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      }
    );
  }, []);

  // 🔹 Cek apakah status menu aktif
  const isStatusAktif = (status) => {
    if (typeof status === "boolean") return status;
    if (typeof status === "number") return status === 1;
    if (typeof status === "string") {
      const s = status.toLowerCase().trim();
      return ![
        "habis", "nonaktif", "kosong", "sold out", "unavailable",
        "tidak tersedia", "off", "disabled"
      ].includes(s);
    }
    return true;
  };

  // 🔹 Cek apakah menu termasuk rekomendasi
  const isRekomendasi = (item) => {
    const rekom = item.isRecommended; // Ganti dari item.rekomendasi
    if (rekom === true || rekom === "true" || rekom === 1 || rekom === "1") {
      return true;
    }
    // fallback kalau belum ada field isRecommended
    return typeof item.rating === "number" && item.rating >= 4.5 && isStatusAktif(item.status);
  };

  const filteredList = food_list.filter((item) => {
    const aktif = isStatusAktif(item.status);

    if (category === "All") {
      return aktif && isRekomendasi(item);
    } else {
      return item.category === category;
    }
  });

  return (
    <div className="food-display" id="food-display">
      <h2>{category === "All" ? "Menu Rekomendasi" : `Menu ${category}`}</h2>
      <div className="food-display-list" ref={listRef}>
        {filteredList.length > 0 ? (
          filteredList.map((item, index) => (
            <FoodItem
              key={index}
              id={item._id}
              name={item.name}
              description={item.description}
              price={item.price}
              image={item.image}
              status={item.status}
              rating={item.rating}
            />
          ))
        ) : (
          <p className="empty-message">Belum ada menu untuk kategori ini.</p>
        )}
      </div>
    </div>
  );
};

export default FoodDisplay;
