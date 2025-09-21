import React, { useEffect } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from './components/Sidebar/Sidebar';
import Navbar from './components/Navbar/Navbar';
import Add from './pages/Add/Add';
import List from './pages/List/List';
import Orders from './pages/Orders/Orders';
import Dashboard from './pages/Dashboard/dashboard';
import Kelolamenu from './pages/kelolamenu/kelolamenu';
import Kelolapesanan from './pages/Kelolapesanan/kelolapesanan';
import Kelolapengguna from './pages/Kelolapengguna/kelolapengguna';
import Kelolakeuangan from './pages/Kelolakeuangan/kelolakeuangan';
import Login from './pages/login/login';
import Logout from './pages/logout';
import PrivateRoute from './components/PrivateRoute';
import AdminChat from './pages/AdminChat/AdminChat';
import Kelolavoucher from './pages/Kelolavoucher/Kelolavoucher';
import KelolaUlasan from './pages/KelolaUlasan/KelolaUlasan';


const App = () => {
  const url = "http://localhost:4000";
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === '/login';

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      console.log('Current token in App.js:', token);

      if (!isLoginPage && !token) {
        console.log('No token found, redirecting to login');
        navigate('/login');
        return;
      }

      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const now = Math.floor(Date.now() / 1000);

          if (payload.exp && payload.exp < now) {
            console.log('Token expired');
            localStorage.removeItem('authToken');
            if (!isLoginPage) navigate('/login');
          }
        } catch (e) {
          console.error('Invalid token:', e);
          localStorage.removeItem('authToken');
          if (!isLoginPage) navigate('/login');
        }
      }
    };

    checkAuth();
  }, [location.pathname, navigate, isLoginPage]);

  return (
    <div>
      <ToastContainer />
      {!isLoginPage && <Navbar />}
      {!isLoginPage && <hr />}
      <div className={isLoginPage ? '' : 'app-content'}>
        {!isLoginPage && <Sidebar />}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/logout" element={<Logout />} />

          {/* Rute yang dilindungi */}
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/add" element={<PrivateRoute><Add url={url} /></PrivateRoute>} />
          <Route path="/list" element={<PrivateRoute><List url={url} /></PrivateRoute>} />
          <Route path="/orders" element={<PrivateRoute><Orders url={url} /></PrivateRoute>} />
          <Route path="/kelolamenu" element={<PrivateRoute><Kelolamenu url={url} /></PrivateRoute>} />
          <Route path="/kelolapesanan" element={<PrivateRoute><Kelolapesanan url={url} /></PrivateRoute>} />
          <Route path="/kelolapengguna" element={<PrivateRoute><Kelolapengguna url={url} /></PrivateRoute>} />
          <Route path="/kelolakeuangan" element={<PrivateRoute><Kelolakeuangan url={url} /></PrivateRoute>} />
          <Route path="/kelolaUlasan" element={<PrivateRoute><KelolaUlasan url={url} /></PrivateRoute>} />
          <Route path="/kelolavoucher" element={<PrivateRoute><Kelolavoucher url={url} /></PrivateRoute>} />
          <Route path="/chat" element={<PrivateRoute><AdminChat /></PrivateRoute>} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
