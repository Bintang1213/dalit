import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const location = useLocation();
  const [authStatus, setAuthStatus] = useState('checking'); // checking, authenticated, unauthenticated

  useEffect(() => {
    const verifyAuth = () => {
      const token = localStorage.getItem('authToken');
      const adminId = localStorage.getItem('adminId');

      console.log('[PrivateRoute] Verifying auth...');
      console.log('[PrivateRoute] Token:', token);
      console.log('[PrivateRoute] AdminID:', adminId);

      if (!token || !adminId) {
        console.log('[PrivateRoute] No token or adminId found');
        setAuthStatus('unauthenticated');
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('[PrivateRoute] Token payload:', payload);

        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
          console.log('[PrivateRoute] Token expired');
          setAuthStatus('unauthenticated');
          return;
        }

        // ✅ Perbaikan: gunakan `adminId`, bukan `id`
        if (!payload.adminId || payload.adminId !== adminId) {
          console.log('[PrivateRoute] AdminID mismatch in token');
          setAuthStatus('unauthenticated');
          return;
        }

        console.log('[PrivateRoute] Authentication valid');
        setAuthStatus('authenticated');
      } catch (error) {
        console.error('[PrivateRoute] Token parsing error:', error);
        setAuthStatus('unauthenticated');
      }
    };

    verifyAuth();
  }, [location.pathname]);

  const clearAuthStorage = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('adminId');
    localStorage.removeItem('adminName');
  };

  if (authStatus === 'checking') {
    return <div className="auth-checking">Verifying authentication...</div>;
  }

  if (authStatus === 'unauthenticated') {
    clearAuthStorage();
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;
