import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Hapus semua item auth dari localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('adminId');
    
    console.log('User logged out, localStorage cleared');
    
    // Redirect ke halaman login
    navigate('/login', { replace: true });
  }, [navigate]);

  return (
    <div className="logout-container">
      <p>Sedang keluar...</p>
    </div>
  );
};

export default Logout;