import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// Import axios/api instance chung từ src/services/api
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
      // 1. Gửi đúng JSON Object mà Pydantic/UserLogin schema mong đợi
      const payload = {
        username: username.trim(),
        password: password,
      };

      // 2. Gọi API đăng nhập với Content-Type application/json
      const response = await api.post("/auth/login", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const { user, access_token } = response.data;

      // 3. Lưu token & user info
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }
      if (access_token) {
        localStorage.setItem("token", access_token);
        localStorage.setItem("access_token", access_token);
      }

      window.dispatchEvent(new Event("userChanged"));

      // 4. Chuyển hướng theo role
      if (user?.role === "admin") {
        navigate("/admin", { replace: true });
      } else if (user?.role === "moderator") {
        navigate("/movie-management", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);

      const detail = error.response?.data?.detail;

      if (Array.isArray(detail)) {
        const errorMsg = detail
          .map(
            (err) =>
              `${err.loc?.[err.loc?.length - 1] || "trường"}: ${err.msg}`,
          )
          .join(" | ");
        setMessage(errorMsg);
      } else if (typeof detail === "string") {
        setMessage(detail);
      } else {
        setMessage("Tên đăng nhập hoặc mật khẩu không chính xác!");
      }
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
            <label>Tên đăng nhập hoặc Email</label>
            <input
              type="text"
              placeholder="Nhập tên đăng nhập hoặc email"
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
            {loading ? "Đang xử lý..." : "Đăng nhập"}
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
