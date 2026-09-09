import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { checkPaymentStatus } from "../../payment/paymentService";
import "./Profile.css";
import api from "../../../services/api";

function Profile() {
  const navigate = useNavigate();

  const savedUser = localStorage.getItem("user");
  const [user, setUser] = useState(savedUser ? JSON.parse(savedUser) : null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [fullName, setFullName] = useState(user?.full_name || user?.name || "");
  const [isEditingName, setIsEditingName] = useState(false);

  // Email & OTP States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Password Modal States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // States thông báo
  const [message, setMessage] = useState({ type: "", text: "" });
  const [modalMessage, setModalMessage] = useState({ type: "", text: "" });
  const [passwordModalMessage, setPasswordModalMessage] = useState({
    type: "",
    text: "",
  });

  useEffect(() => {
    if (!user || !user.id) return;

    const syncUserData = async () => {
      try {
        setLoading(true);
        const res = await checkPaymentStatus(user.id);

        if (res) {
          const updatedUser = {
            ...user,
            is_premium: res.is_premium,
            premium_lifetime: res.premium_lifetime,
            premium_expired_at: res.premium_expired_at,
          };

          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
          window.dispatchEvent(new Event("userChanged"));
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.warn("Chưa tìm thấy lịch sử giao dịch của người dùng.");
        } else {
          console.error("Lỗi đồng bộ thông tin tài khoản:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    syncUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Đếm ngược gửi lại OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Hàm bổ trợ lấy chữ cái đầu tiên viết HOA
  const getInitialLetter = () => {
    const nameStr = user?.username || user?.full_name || user?.email || "U";
    return nameStr.trim().charAt(0).toUpperCase();
  };

  const updateLocalUser = (newFields) => {
    const updated = { ...user, ...newFields };
    setUser(updated);
    localStorage.setItem("user", JSON.stringify(updated));
    window.dispatchEvent(new Event("userChanged"));
  };

  // 1. CẬP NHẬT ẢNH ĐẠI DIỆN
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post(`/upload/avatar/${user.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      updateLocalUser({ avatar: response.data.avatar });
      setMessage({
        type: "success",
        text: "Cập nhật ảnh đại diện thành công!",
      });
    } catch (error) {
      console.error("Lỗi upload avatar:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.detail ||
          error.message ||
          "Cập nhật ảnh đại diện thất bại!",
      });
    }
  };

  // 2. CẬP NHẬT TÊN HIỂN THỊ (ĐÃ ĐƯỢC SỬA LỖI 404)
const handleSaveName = async () => {
  if (!fullName.trim()) return;

  try {
    await api.put("/auth/users/me", {
      full_name: fullName.trim(),
    });

    updateLocalUser({ full_name: fullName.trim(), name: fullName.trim() });
    setIsEditingName(false);
    setMessage({ type: "success", text: "Đổi tên hiển thị thành công!" });
  } catch (error) {
    console.error("Lỗi đổi tên:", error);
    setMessage({
      type: "error",
      text: error.response?.data?.detail || error.message || "Đổi tên thất bại!",
    });
  }
};

  // 3. GỬI MÃ OTP VỀ EMAIL MỚI
  const handleSendOTP = async () => {
    setModalMessage({ type: "", text: "" });

    if (!currentPassword) {
      setModalMessage({
        type: "error",
        text: "Vui lòng nhập mật khẩu hiện tại!",
      });
      return;
    }

    if (!newEmail.trim() || !newEmail.includes("@")) {
      setModalMessage({ type: "error", text: "Email mới không hợp lệ!" });
      return;
    }

    if (newEmail.trim() === user.email) {
      setModalMessage({
        type: "error",
        text: "Email mới phải khác email hiện tại!",
      });
      return;
    }

    try {
      const response = await api.post("/auth/send-otp", {
        user_id: user.id,
        current_password: currentPassword,
        new_email: newEmail.trim(),
      });

      setOtpSent(true);
      setCountdown(60);
      setModalMessage({
        type: "success",
        text: response.data?.message || `Đã gửi mã OTP đến ${newEmail}`,
      });
    } catch (error) {
      console.error("Lỗi gửi mã OTP:", error);
      setModalMessage({
        type: "error",
        text:
          error.response?.data?.detail ||
          error.response?.data?.message ||
          error.message ||
          "Lỗi gửi mã OTP!",
      });
    }
  };

  // 4. XÁC THỰC OTP VÀ ĐỔI EMAIL
  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setModalMessage({
        type: "error",
        text: "Vui lòng nhập đủ 6 chữ số OTP!",
      });
      return;
    }

    try {
      const response = await api.post("/auth/verify-otp-change-email", {
        user_id: user.id,
        new_email: newEmail.trim(),
        otp: otpCode.trim(),
      });

      updateLocalUser({ email: response.data?.new_email || newEmail.trim() });
      setShowEmailModal(false);
      setOtpSent(false);
      setCurrentPassword("");
      setNewEmail("");
      setOtpCode("");
      setModalMessage({ type: "", text: "" });
      setMessage({ type: "success", text: "Cập nhật Email thành công!" });
    } catch (error) {
      console.error("Lỗi xác thực OTP:", error);
      setModalMessage({
        type: "error",
        text:
          error.response?.data?.detail ||
          error.message ||
          "Mã OTP không chính xác!",
      });
    }
  };

  // 5. ĐỔI MẬT KHẨU
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordModalMessage({ type: "", text: "" });

    if (oldPassword === newPassword) {
      setPasswordModalMessage({
        type: "error",
        text: "Mật khẩu mới không được trùng với mật khẩu hiện tại!",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordModalMessage({
        type: "error",
        text: "Mật khẩu xác nhận không khớp!",
      });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordModalMessage({
        type: "error",
        text: "Mật khẩu mới phải từ 6 ký tự trở lên!",
      });
      return;
    }

    try {
      await api.post("/auth/change-password", {
        email: user.email,
        old_password: oldPassword,
        new_password: newPassword,
      });

      setShowPasswordModal(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage({ type: "success", text: "Đổi mật khẩu thành công!" });
    } catch (error) {
      console.error("Lỗi đổi mật khẩu:", error);
      setPasswordModalMessage({
        type: "error",
        text:
          error.response?.data?.detail ||
          error.message ||
          "Đổi mật khẩu thất bại!",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("userChanged"));
    navigate("/");
  };

  const renderRoleName = (role) => {
    switch (role) {
      case "admin":
        return "Quản trị viên";
      case "moderator":
        return "Kiểm duyệt viên (Moderator)";
      default:
        return "Người dùng";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!user) return null;

  return (
    <div className="profile-page">
      <div className="profile-card">
        {/* KHUNG ẢNH ĐẠI DIỆN WITH UPLOAD */}
        <div className="profile-avatar-container">
          <div className="profile-avatar">
            {user.avatar ? (
              <img src={user.avatar} alt="Avatar" />
            ) : (
              <div className="user-avatar">{getInitialLetter()}</div>
            )}
          </div>
          <label
            htmlFor="avatar-upload"
            className="avatar-edit-badge"
            title="Đổi ảnh đại diện"
          >
            📷
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            hidden
          />
        </div>

        <h1>Thông tin tài khoản</h1>

        {message.text && (
          <div className={`profile-alert ${message.type}`}>{message.text}</div>
        )}

        {loading && (
          <p className="syncing-text">🔄 Đang đồng bộ dữ liệu mới nhất...</p>
        )}

        <div className="profile-info">
          <div className="info-row">
            <span>Tên đăng nhập</span>
            <strong>{user.username}</strong>
          </div>

          <div className="info-row">
            <span>Tên hiển thị</span>
            {isEditingName ? (
              <div className="inline-edit">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập tên hiển thị"
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  className="save-btn"
                >
                  Lưu
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="cancel-btn"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <div className="value-with-btn">
                <strong>{user.full_name || user.name || "Chưa đặt tên"}</strong>
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="edit-link"
                >
                  ✏️ Đổi
                </button>
              </div>
            )}
          </div>

          <div className="info-row">
            <span>Email</span>
            <div className="value-with-btn">
              <strong>{user.email}</strong>
              <button
                type="button"
                onClick={() => {
                  setModalMessage({ type: "", text: "" });
                  setShowEmailModal(true);
                }}
                className="edit-link"
              >
                ✉️ Đổi Email
              </button>
            </div>
          </div>

          <div className="info-row">
            <span>Vai trò</span>
            <strong>{renderRoleName(user.role)}</strong>
          </div>

          <div className="info-row">
            <span>Gói tài khoản</span>
            <strong>
              {user.is_premium ? (
                <span className="premium-text">
                  ⭐ Premium {user.premium_lifetime ? "(Vĩnh viễn)" : ""}
                </span>
              ) : (
                "Miễn phí"
              )}
            </strong>
          </div>

          {user.is_premium &&
            !user.premium_lifetime &&
            user.premium_expired_at && (
              <div className="info-row">
                <span>Hạn sử dụng</span>
                <strong className="expire-text">
                  {formatDate(user.premium_expired_at)}
                </strong>
              </div>
            )}

          <div className="info-row">
            <span>Trạng thái</span>
            <strong>
              {user.is_active !== false ? "Hoạt động" : "Đã khóa"}
            </strong>
          </div>
        </div>

        <div className="profile-actions">
          <button
            type="button"
            className="upgrade-btn"
            onClick={() => navigate("/premium")}
          >
            {user.is_premium ? "⭐ Gia hạn Premium" : "🚀 Nâng cấp Premium"}
          </button>

          <button
            type="button"
            className="change-password-btn"
            onClick={() => {
              setPasswordModalMessage({ type: "", text: "" });
              setShowPasswordModal(true);
            }}
          >
            🔐 Đổi mật khẩu
          </button>

          <button
            type="button"
            className="profile-logout-btn"
            onClick={handleLogout}
          >
            Đăng xuất
          </button>
        </div>
      </div>

      {/* MODAL ĐỔI EMAIL QUA OTP */}
      {showEmailModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Đổi địa chỉ Email</h3>
            <p className="modal-sub">
              Mã xác thực OTP sẽ được gửi về email mới của bạn.
            </p>

            {modalMessage.text && (
              <div className={`profile-alert ${modalMessage.type}`}>
                {modalMessage.text}
              </div>
            )}

            <div className="form-group">
              <label>Mật khẩu hiện tại</label>
              <input
                type="password"
                placeholder="Nhập mật khẩu hiện tại..."
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={otpSent}
              />
            </div>

            <div className="form-group">
              <label>Email mới</label>
              <div className="input-with-btn">
                <input
                  type="email"
                  placeholder="Nhập email mới..."
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={otpSent}
                />
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={countdown > 0}
                  className="send-otp-btn"
                >
                  {countdown > 0
                    ? `${countdown}s`
                    : otpSent
                    ? "Gửi lại"
                    : "Gửi mã"}
                </button>
              </div>
            </div>

            {otpSent && (
              <div className="form-group">
                <label>Mã xác thực OTP</label>
                <input
                  type="text"
                  placeholder="Nhập 6 số OTP"
                  value={otpCode}
                  maxLength={6}
                  onChange={(e) => setOtpCode(e.target.value)}
                />
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  setShowEmailModal(false);
                  setOtpSent(false);
                  setCurrentPassword("");
                  setNewEmail("");
                  setOtpCode("");
                  setModalMessage({ type: "", text: "" });
                }}
              >
                Hủy
              </button>
              {otpSent && (
                <button
                  type="button"
                  className="confirm-btn"
                  onClick={handleVerifyOTP}
                >
                  Xác nhận đổi
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL ĐỔI MẬT KHẨU */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Đổi mật khẩu</h3>

            {passwordModalMessage.text && (
              <div className={`profile-alert ${passwordModalMessage.type}`}>
                {passwordModalMessage.text}
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label>Mật khẩu hiện tại</label>
                <input
                  type="password"
                  required
                  placeholder="Nhập mật khẩu hiện tại"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Mật khẩu mới</label>
                <input
                  type="password"
                  required
                  placeholder="Nhập mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  required
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordModalMessage({ type: "", text: "" });
                  }}
                >
                  Hủy
                </button>
                <button type="submit" className="confirm-btn">
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;