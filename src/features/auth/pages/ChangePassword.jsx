import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../../services/api";
import "./Profile.css";

function ChangePassword() {
  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (newPassword !== confirmPassword) {
      setMessage("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);

    try {
      // ✅ SỬA: CHỈ GỬI old_password VÀ new_password (Sử dụng Cookie để xác thực User)
      const response = await api.post("/auth/change-password", {
        old_password: oldPassword,
        new_password: newPassword,
      });

      alert(response.data.message || "Đổi mật khẩu thành công!");
      navigate("/profile");

    } catch (error) {
      // Nếu Backend trả về 401 (Chưa đăng nhập / Cookie hết hạn) -> Chuyển hướng sang Login
      if (error.response?.status === 401) {
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setMessage(
        error.response?.data?.detail || "Đổi mật khẩu thất bại. Vui lòng thử lại!"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h1>🔐 Đổi mật khẩu</h1>

        {message && <div className="auth-message">{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Mật khẩu hiện tại</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Mật khẩu mới</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Xác nhận mật khẩu mới</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div className="profile-actions">
            <button
              type="button"
              className="profile-logout-btn"
              onClick={() => navigate("/profile")}
            >
              Hủy
            </button>

            <button
              type="submit"
              className="change-password-btn"
              disabled={loading}
            >
              {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChangePassword;