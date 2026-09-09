import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../../../services/api";

import "../styles/Auth.css";

function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      await api.post("/auth/register", {
        username,
        email,
        password,
      });

      alert("Đăng ký thành công! Vui lòng đăng nhập.");

      navigate("/login");
    } catch (error) {
      setMessage(error.response?.data?.detail || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">MOVIEHUB</div>

        <h1>Tạo tài khoản 🎬</h1>

        <p className="auth-subtitle">
          Đăng ký để khám phá thế giới phim của MovieHub
        </p>

        {message && <div className="auth-message">{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Tên đăng nhập</label>

            <input
              type="text"
              placeholder="Nhập tên đăng nhập"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Email</label>

            <input
              type="email"
              placeholder="Nhập email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Mật khẩu</label>

            <input
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Đang đăng ký..." : "Tạo tài khoản"}
          </button>
        </form>

        <p className="auth-footer">
          Đã có tài khoản?
          <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
