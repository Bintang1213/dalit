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
  const [data, setData] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const onLogin = async (event) => {
    event.preventDefault();
    setLoading(true);

    const newUrl =
      url + (currState === "Login" ? "/api/user/login" : "/api/user/register");

    try {
      const response = await axios.post(newUrl, data);

      if (response.data.success) {
        if (currState === "Login") {
          setToken(response.data.token);
          localStorage.setItem("token", response.data.token);

          // Toast sukses login dengan durasi 2500ms
          toast.success("Anda berhasil login", {
            position: "top-center",
            autoClose: 2500,
            onClose: () => {
              setShowLogin(false);         // popup hilang setelah toast selesai
              onLoginSuccess?.();          // panggil callback dropdown akun
            },
          });
        } else {
          toast.success("Registrasi berhasil! Silakan login.", {
            position: "top-center",
            autoClose: 2500,
          });
          setCurrState("Login");
          setData({ name: "", email: "", password: "" });
        }
      } else {
        toast.error(response.data.message, {
          position: "top-center",
          autoClose: 2500,
        });
      }
    } catch (error) {
      toast.error("Terjadi kesalahan. Silakan coba lagi.", {
        position: "top-center",
        autoClose: 2500,
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-popup">
      <ToastContainer />
      <form onSubmit={onLogin} className="login-popup-container">
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
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Buat Password"
              value={data.password}
              onChange={onChangeHandler}
              required
              style={{ width: "100%", paddingRight: "40px" }}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                top: "50%",
                right: "10px",
                transform: "translateY(-50%)",
                cursor: "pointer",
                fontSize: "18px",
                color: "#555",
              }}
            >
              {showPassword ? <FaEye /> : <FaEyeSlash />}
            </span>
          </div>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : currState === "Login" ? "Masuk" : "Daftar"}
        </button>

        {currState === "Daftar" && (
          <div className="login-popup-condition">
            <input type="checkbox" required />
            <p>
              Dengan melanjutkan, saya menyetujui ketentuan penggunaan & kebijakan
              privasi
            </p>
          </div>
        )}

        {currState === "Login" && (
          <p
            style={{ marginTop: "10px", color: "#007bff", cursor: "pointer" }}
            onClick={() =>
              toast.info(
                "Fitur lupa password belum tersedia. Hubungi admin.",
                { position: "top-center", autoClose: 2500 }
              )
            }
          >
            Lupa kata sandi?
          </p>
        )}

        <p>
          {currState === "Login" ? (
            <>
              Belum punya akun?{" "}
              <span onClick={() => setCurrState("Daftar")}>Daftar Sekarang</span>
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
