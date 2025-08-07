import React from "react";
import "./navbar.css";
import { assets } from "../../assets/assets";
import { FaUser } from "react-icons/fa";

const Navbar = () => {
  const adminName = "Admin";

  return (
    <div className="navbar">
      <div className="navbar-logo">
        <img className="logo" src={assets.Tengko} alt="Logo" />
      </div>

      <div className="navbar-content">
        <div className="sticky-note">
          <span>Hi, {adminName}</span>
          <FaUser />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
