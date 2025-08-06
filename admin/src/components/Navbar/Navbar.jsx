import React from "react";
import "./navbar.css";
import { assets } from "../../assets/assets";
import { FaUser } from "react-icons/fa";

const Navbar = () => {
  const adminName = "Admin"; // Bisa ambil dari localStorage jika perlu

  return (
    <div className="navbar">
      <div className="navbar-left">
        <img className="logo" src={assets.Tengko} alt="Logo" />
      </div>

      <div className="navbar-right">
        <div className="sticky-note">
          <FaUser />
          <span>Selamat datang, {adminName}</span>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
