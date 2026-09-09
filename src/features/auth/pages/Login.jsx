import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// Import axios/api instance chung từ src/services/api (lùi 4 cấp thư mục)
import api from "../../../services/api";

import "../styles/Auth.css";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        username,
        password,
      });

      const user = response.data.user;

      localStorage.setItem("user", JSON.stringify(user));

      window.dispatchEvent(new Event("userChanged"));

      // ĐIỀU HƯỚNG DỰA TRÊN ROLE
      if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else if (user.role === "moderator") {
        navigate("/movie-management", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);

      setMessage(error.response?.data?.detail || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">MOVIEHUB</div>

        <h1>Chào mừng trở lại 👋</h1>

        <p className="auth-subtitle">
          Đăng nhập để tiếp tục xem những bộ phim yêu thích
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
            <label>Mật khẩu</label>
            <input
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="forgot-password">
              <Link to="/forgot-password">Quên mật khẩu?</Link>
            </div>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <p className="auth-footer">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;