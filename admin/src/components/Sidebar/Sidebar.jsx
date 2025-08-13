import React, { useState } from 'react';
import './sidebar.css';
import { NavLink } from 'react-router-dom';
import { FaTachometerAlt, FaUtensils, FaClipboardList, FaUsers, FaMoneyBillWave, FaSignOutAlt } from 'react-icons/fa';
import tengkoLogo from '../../assets/tengko.png'; // Pastikan path ini sesuai dengan struktur folder kamu

const Sidebar = () => {
  const [isClosed, setIsClosed] = useState(false);

  const toggleSidebar = () => {
    setIsClosed(!isClosed);
  };

  return (
    <div className={`sidebar ${isClosed ? 'closed' : ''}`}>
      {/* Logo Utama */}
      <div className="sidebar-header">
        <img src={tengkoLogo} alt="Logo Wartiyem" className="sidebar-logo" />
      </div>

      {/* Tombol Toggle */}
      <button className="toggle-btn" onClick={toggleSidebar}>
        {isClosed ? '☰' : '⮜'}
      </button>

      {/* Menu */}
      <div className="sidebar-options">
        <NavLink to="/dashboard" className="sidebar-option" activeclassname="active">
          <FaTachometerAlt className="menu-icon" />
          <p>Dashboard</p>
        </NavLink>
        <NavLink to="/kelolamenu" className="sidebar-option" activeclassname="active">
          <FaUtensils className="menu-icon" />
          <p>Kelola Menu</p>
        </NavLink>
        <NavLink to="/kelolapesanan" className="sidebar-option" activeclassname="active">
          <FaClipboardList className="menu-icon" />
          <p>Kelola Pesanan</p>
        </NavLink>
        <NavLink to="/kelolapengguna" className="sidebar-option" activeclassname="active">
          <FaUsers className="menu-icon" />
          <p>Kelola Pengguna</p>
        </NavLink>
        <NavLink to="/kelolakeuangan" className="sidebar-option" activeclassname="active">
          <FaMoneyBillWave className="menu-icon" />
          <p>Laporan Keuangan</p>
        </NavLink>
        <NavLink to="/logout" className="sidebar-option" activeclassname="active">
          <FaSignOutAlt className="menu-icon" />
          <p>Logout</p>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
