import React, { useContext, useState, useEffect, useRef } from "react";
import './Navbar.css';
import { assets } from '../../assets/assets';
import { Link } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";

const Navbar = ({ setShowLogin }) => {
  const [menu, setMenu] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { getTotalCartAmount, token, setToken, user } = useContext(StoreContext);

  const profileDropdownRef = useRef();
  const menuRef = useRef();

  const handleSearch = () => {
    if (searchQuery.trim() !== "") {
      toast.info(`Mencari: ${searchQuery}`, { position: "top-center", autoClose: 2000 });
    }
  };

  const handleLogout = () => {
  localStorage.removeItem("token");
  setToken(""); // reset token di context juga biar langsung ke-update

  toast.success("Anda berhasil logout", {
    style: { background: "white", color: "black" }
  });

  // kasih delay dikit supaya toast sempet muncul sebelum login form tampil
  setTimeout(() => {
    setShowLogin(true);
  }, 300);
};

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setShowProfileDropdown(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target) && !e.target.closest(".hamburger")) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="navbar-container">
      <div className="navbar">
        <Link to='/'><img src={assets.w} alt="logo" className="navbar-logo" /></Link>

        <div className="hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <i className={mobileMenuOpen ? "bi bi-x-lg" : "bi bi-list"}></i>
        </div>

        <ul ref={menuRef} className={`navbar-menu ${mobileMenuOpen ? "active" : ""}`}>
          <Link to="/" onClick={() => { setMenu("home"); setMobileMenuOpen(false); }} className={menu === "home" ? "active" : ""}>Beranda</Link>
          <Link to="/Menu" onClick={() => { setMenu("menu"); setMobileMenuOpen(false); }} className={menu === "menu" ? "active" : ""}>Menu</Link>
          <Link to="/riwayat" onClick={() => { setMenu("pesanan"); setMobileMenuOpen(false); }} className={menu === "pesanan" ? "active" : ""}>Pesanan</Link>
          <Link to="/tentang-kami" onClick={() => { setMenu("tentang"); setMobileMenuOpen(false); }} className={menu === "tentang" ? "active" : ""}>Tentang Kami</Link>
        </ul>

        <div className="navbar-right">
          <div className="search-container">
            <input
              type="text"
              placeholder="Mau Cari Apa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <i className="bi bi-search" onClick={handleSearch}></i>
          </div>

          <div className="navbar-search-icon">
            <Link to='/cart'><i className="bi bi-cart3"></i></Link>
            <div className={getTotalCartAmount() === 0 ? "" : "dot"}></div>
          </div>

          {!token ? (
            <button onClick={() => setShowLogin(true)}>Masuk</button>
          ) : (
            <div className="navbar-profile" ref={profileDropdownRef}>
              <div className="profile-icon-circle" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>

              {showProfileDropdown && (
                <ul className="nav-profile-dropdown">
                  <li className="dropdown-item name">
                    <i className="bi bi-person"></i> {user?.name}
                  </li>
                  <li className="dropdown-item email">
                    <i className="bi bi-envelope"></i> {user?.email}
                  </li>
                  <li className="dropdown-item logout" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right"></i> Keluar
                </li>
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;