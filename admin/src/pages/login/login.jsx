import React, { useState } from "react";
import Axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "./login.css";

const Login = () => {
  const [email, setEmail] = useState(""); // Ganti dari username ke email
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await Axios.post(
        "http://localhost:4000/api/admin/login", 
        {
          email,
          password
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true
        }
      );

      console.log("Login Response:", response.data);

      if (response.data.token) {
        localStorage.setItem("authToken", response.data.token);
        localStorage.setItem("adminId", response.data.adminId);

        // ✅ Simpan nama admin kalau dikirim dari backend
        if (response.data.adminName) {
          localStorage.setItem("adminName", response.data.adminName);
        }

        const from = location.state?.from?.pathname || "/dashboard";
        navigate(from, { replace: true });
      } else {
        throw new Error("Token tidak diterima dari server");
      }
    } catch (error) {
      console.error("Login error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });

      const backendMessage = error.response?.data?.message;
      setError(backendMessage || "Login gagal. Periksa email dan password Anda.");
      
      localStorage.removeItem("authToken");
      localStorage.removeItem("adminId");
      localStorage.removeItem("adminName");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Login Admin</h2>
        {error && (
          <div className="error-message">
            <i className="error-icon">!</i>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="contoh@email.com"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Masukkan password"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className={`login-button ${loading ? "loading" : ""}`}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Memproses...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
