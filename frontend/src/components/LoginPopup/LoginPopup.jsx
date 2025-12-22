import React, { useContext, useState } from "react";
import "./LoginPopup.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const LoginPopup = ({ setShowLogin, onLoginSuccess }) => {
  const { url, setToken } = useContext(StoreContext);

  const [currState, setCurrState] = useState("Login");
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const onLogin = async (e) => {
    e.preventDefault();

    if (currState === "Daftar" && data.password !== data.confirmPassword) {
      toast.error("Password dan konfirmasi password tidak sama");
      return;
    }

    setLoading(true);

    const endpoint =
      currState === "Login"
        ? "/api/user/login"
        : "/api/user/register";

    const payload =
      currState === "Login"
        ? { email: data.email, password: data.password }
        : { name: data.name, email: data.email, password: data.password };

    try {
      const res = await axios.post(url + endpoint, payload);

      if (res.data.success) {
        if (currState === "Login") {
          setToken(res.data.token);
          localStorage.setItem("token", res.data.token);
          toast.success("Berhasil login");
          setTimeout(() => {
            setShowLogin(false);
            onLoginSuccess?.();
          }, 800);
        } else {
          toast.success("Registrasi berhasil, silakan login");
          setCurrState("Login");
          setData({
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
          });
        }
      } else {
        toast.error(res.data.message);
      }
    } catch {
      toast.error("Terjadi kesalahan, coba lagi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-popup">
      <ToastContainer position="top-right" autoClose={2000} />

      <form className="login-popup-container" onSubmit={onLogin}>
        <div className="login-popup-title">
          <h2>{currState === "Login" ? "Masuk" : "Daftar"}</h2>
          <img
            src={assets.cross_icon}
            alt="Tutup"
            onClick={() => setShowLogin(false)}
          />
        </div>

        <div className="login-popup-inputs">
          {currState === "Daftar" && (
            <input
              type="text"
              name="name"
              placeholder="Nama"
              value={data.name}
              onChange={onChangeHandler}
              required
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={data.email}
            onChange={onChangeHandler}
            required
          />

          {/* PASSWORD */}
          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={data.password}
              onChange={onChangeHandler}
              required
            />
            <span onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEye /> : <FaEyeSlash />}
            </span>
          </div>

          {/* CONFIRM PASSWORD */}
          {currState === "Daftar" && (
            <div className="password-field">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Konfirmasi Password"
                value={data.confirmPassword}
                onChange={onChangeHandler}
                required
              />
              <span
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
              >
                {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
              </span>
            </div>
          )}
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Memproses..." : currState === "Login" ? "Masuk" : "Daftar"}
        </button>

        {currState === "Daftar" && (
          <div className="login-popup-condition">
            <input type="checkbox" required />
            <p>Saya menyetujui syarat & kebijakan privasi</p>
          </div>
        )}

        <p className="switch-text">
          {currState === "Login" ? (
            <>
              Belum punya akun?{" "}
              <span onClick={() => setCurrState("Daftar")}>
                Daftar Sekarang
              </span>
            </>
          ) : (
            <>
              Sudah punya akun?{" "}
              <span onClick={() => setCurrState("Login")}>Masuk</span>
            </>
          )}
        </p>
      </form>
    </div>
  );
};

export default LoginPopup;
