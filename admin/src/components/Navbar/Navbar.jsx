import React from "react";
import "./navbar.css";
import { FaUser } from "react-icons/fa";

const Navbar = () => {
  const adminName = "Admin";

  return (
    <div className="navbar">
      <div className="navbar-content">
        <div className="sticky-note">
          <span>Hi {adminName}</span>
          <FaUser />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
