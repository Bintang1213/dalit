import React, { useContext, useState } from "react";
import "./LoginPopup.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const LoginPopup = ({ setShowLogin }) => {
  const { url, setToken } = useContext(StoreContext);

  const [currState, setCurrState] = useState("Login");
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const onLogin = async (event) => {
    event.preventDefault();
    let newUrl = url + (currState === "Login" ? "/api/user/login" : "/api/user/register");

    try {
      const response = await axios.post(newUrl, data);

      if (response.data.success) {
        if (currState === "Login") {
          setToken(response.data.token);
          localStorage.setItem("token", response.data.token);
          setShowLogin(false);
        } else {
          alert("Registrasi berhasil! Silakan login.");
          setCurrState("Login");
          setData({ name: "", email: "", password: "" });
        }
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      alert("Terjadi kesalahan. Silakan coba lagi.");
      console.error(error);
    }
  };

  return (
    <div className="login-popup">
      <form onSubmit={onLogin} className="login-popup-container">
        <div className="login-popup-title">
          <h2>{currState === "Login" ? "Masuk" : "Daftar"}</h2>
          <img src={assets.cross_icon} alt="Tutup" onClick={() => setShowLogin(false)} />
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
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
        </div>

        <button type="submit">{currState === "Login" ? "Masuk" : "Daftar"}</button>

        {currState === "Daftar" && (
          <div className="login-popup-condition">
            <input type="checkbox" required />
            <p>
              Dengan melanjutkan, saya menyetujui ketentuan penggunaan & kebijakan privasi
            </p>
          </div>
        )}
        {currState === "Login" && (
          <p
            style={{ marginTop: "10px", color: "#007bff", cursor: "pointer" }}
            onClick={() => alert("Fitur lupa password belum tersedia. Hubungi admin.")}
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
