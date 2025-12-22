import React, { useState } from "react";
import Axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import "./login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data.token) {
        localStorage.setItem("authToken", response.data.token);
        localStorage.setItem("adminId", response.data.adminId);

        if (response.data.adminName) {
          localStorage.setItem("adminName", response.data.adminName);
        }

        navigate(location.state?.from?.pathname || "/dashboard", {
          replace: true,
        });
      } else {
        throw new Error();
      }
    } catch {
      setError("Login gagal. Periksa email dan password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>KEDAI WARTIYEM</h1>
          <p>Admin Dashboard</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Admin</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contoh@gmail.com"
              required
            />
          </div>

          {/* PASSWORD + ICON */}
          <div className="form-group password-group">
            <label>Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password visibility"
            >
              {showPassword ? <FiEye /> : <FiEyeOff />}
            </button>
          </div>

          <button
            type="submit"
            className={`login-button ${loading ? "loading" : ""}`}
            disabled={loading}
          >
            {loading ? "Memproses..." : "Masuk Dashboard"}
          </button>
        </form>

        <p className="login-footer">© Kedai Wartiyem</p>
      </div>
    </div>
  );
};

export default Login;
