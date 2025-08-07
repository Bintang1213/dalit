import React from 'react';
import './sidebar.css';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-options">
        <NavLink to="/dashboard" className="sidebar-option" activeclassname="active">
          <p>Dashboard</p>
        </NavLink>
        <NavLink to="/kelolamenu" className="sidebar-option" activeclassname="active">
          <p>Kelola Menu</p>
        </NavLink>
        <NavLink to="/kelolapesanan" className="sidebar-option" activeclassname="active">
          <p>Kelola Pesanan</p>
        </NavLink>
        <NavLink to="/kelolapengguna" className="sidebar-option" activeclassname="active">
          <p>Kelola pengguna</p>
        </NavLink>
        <NavLink to="/kelolakeuangan" className="sidebar-option" activeclassname="active">
          <p>Laporan Keuangan</p>
        </NavLink>
        <NavLink to="/logout" className="sidebar-option" activeclassname="active">
          <p>Logout</p>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
