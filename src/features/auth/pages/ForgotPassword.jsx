import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../../services/api";
import "../styles/Auth.css";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      // Gọi API yêu cầu backend gửi mã OTP về Email người dùng
      await api.post("/auth/forgot-password", { email });

      // Chuyển sang trang nhập OTP & Mật khẩu mới, truyền email đi theo
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (error) {
      setMessage(error.response?.data?.detail || "Không thể gửi mã xác nhận");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">MOVIEHUB</div>
        <h1>Quên mật khẩu? 🔐</h1>
        <p className="auth-subtitle">
          Nhập email của bạn để nhận mã xác thực (OTP)
        </p>

        {message && <div className="auth-message">{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Đang gửi OTP..." : "Tiếp tục"}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/login">← Quay lại đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
