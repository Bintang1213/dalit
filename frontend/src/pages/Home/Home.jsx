// src/pages/Home/Home.jsx
import "./Home.css";
import Header from "../../components/Header/Header";
import ExploreMenu from "../../components/ExploreMenu/ExploreMenu";
import { useState } from "react";
import FoodDisplay from "../../components/foodDisplay/FoodDisplay";
import RecommendedDisplay from "../../components/RecommendedDisplay/RecommendedDisplay";

const Home = () => {
  const [category, setCategory] = useState("All");

  return (
    <div>
      <Header />
      <ExploreMenu category={category} setCategory={setCategory} />

      {category === "All" ? (
        // 🔥 Jika belum pilih kategori → tampilkan menu rekomendasi
        <RecommendedDisplay />
      ) : (
        // 🔥 Jika sudah pilih kategori → tampilkan menu kategori
        <FoodDisplay category={category} />
      )}
    </div>
  );
};

export default Home;
