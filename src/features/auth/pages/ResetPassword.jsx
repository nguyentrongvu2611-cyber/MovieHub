import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

// Import API shared instance (lùi 3 cấp: pages -> auth -> features -> src)
import api from "../../../services/api";

// Import Auth.css nằm trong thư mục src/features/auth/styles/
import "../styles/Auth.css";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);

    try {
      // Đảm bảo tên thuộc tính khớp đúng 100% với Schema FastAPI (email, otp, password)
      const response = await api.post("/auth/reset-password", {
        email: email,
        otp: otp,
        password: password,
      });

      alert(response.data?.message || "Đặt lại mật khẩu thành công!");
      navigate("/login");
    } catch (error) {
      // Ép kiểu hiển thị lỗi an toàn cho React
      const errDetail = error.response?.data?.detail;
      if (typeof errDetail === "string") {
        setMessage(errDetail);
      } else if (Array.isArray(errDetail)) {
        setMessage(errDetail[0]?.msg || "Dữ liệu không hợp lệ");
      } else {
        setMessage("Mã OTP không chính xác hoặc đã hết hạn");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">MOVIEHUB</div>
        <h1>Đặt lại mật khẩu 🔑</h1>
        <p className="auth-subtitle">
          Nhập mã OTP vừa gửi tới email <strong>{email}</strong>
        </p>

        {message && <div className="auth-message">{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Mã OTP (Xác nhận từ Email)</label>
            <input
              type="text"
              placeholder="Nhập mã OTP 6 chữ số"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Mật khẩu mới</label>
            <input
              type="password"
              placeholder="Nhập mật khẩu mới"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Xác nhận mật khẩu</label>
            <input
              type="password"
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Đang cập nhật..." : "Xác nhận đổi mật khẩu"}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/login">← Quay lại đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;