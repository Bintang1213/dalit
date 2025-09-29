// src/pages/Home/Home.jsx
import "./Home.css";
import Header from "../../components/Header/Header";
import ExploreMenu from "../../components/ExploreMenu/ExploreMenu";
import { useState } from "react";
import FoodDisplay from "../../components/foodDisplay/FoodDisplay";
import RecommendedDisplay from "../../components/RecommendedDisplay/RecommendedDisplay"; // Tambahkan import ini

const Home = () => {
  const [category, setCategory] = useState("All");

  return (
    <div>
      <Header />
      <ExploreMenu category={category} setCategory={setCategory} />

      {/* Hanya panggil komponen rekomendasi yang baru */}
      <RecommendedDisplay />

      {/* Hapus atau hapus baris di bawah ini agar menu lama tidak muncul */}
      {/* <FoodDisplay category={category} /> */}
    </div>
  );
};

export default Home;
