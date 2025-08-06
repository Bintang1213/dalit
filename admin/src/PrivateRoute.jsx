import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const location = useLocation();
  const [authStatus, setAuthStatus] = useState('checking');

  useEffect(() => {
    const verifyAuth = () => {
      const token = localStorage.getItem('authToken');
      const adminId = localStorage.getItem('adminId');

      console.log('[PrivateRoute] Verifying auth...');
      console.log('[PrivateRoute] Token:', token);
      console.log('[PrivateRoute] AdminID from storage:', adminId);

      if (!token || !adminId) {
        console.log('[PrivateRoute] Missing token or adminId');
        setAuthStatus('unauthenticated');
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('[PrivateRoute] Token payload:', payload);

        if (!payload.id || payload.id !== adminId) {
          console.log('[PrivateRoute] ID mismatch');
          setAuthStatus('unauthenticated');
          return;
        }

        if (!payload.isAdmin) {
          console.log('[PrivateRoute] Not an admin');
          setAuthStatus('unauthenticated');
          return;
        }

        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
          console.log('[PrivateRoute] Token expired');
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
