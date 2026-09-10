import { useCallback, useEffect, useState } from "react";

import {
  getUsers,
  toggleBanUser,
  hardDeleteUser,
  updatePremium,
  removePremium,
  updateStreaming,
  getUserHistory,
  updateUserRole,
} from "../adminService";

import "./Admin.css";

const formatDate = (dateString) => {
  if (!dateString) return "Chưa xác định";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return date.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatAvatarSrc = (avatar) => {
  if (!avatar) return "";
  if (avatar.startsWith("http://") || avatar.startsWith("https://"))
    return avatar;
  if (avatar.startsWith("/"))
    return `https://moviehub-backend-ln1c.onrender.com${avatar}`;
  if (avatar.startsWith("data:image/")) return avatar;
  return `data:image/png;base64,${avatar}`;
};

function Admin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const [historyUser, setHistoryUser] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // State dành cho Modal Streaming
  const [streamingModal, setStreamingModal] = useState({
    isOpen: false,
    user: null,
    maxScreens: 1,
    videoQuality: "1080p",
    adFree: false,
    canDownload: false,
  });

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isMod = currentUser.role === "moderator";

  const [selectedStat, setSelectedStat] = useState("all");

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi tải danh sách user:", error);
      alert("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const data = await getUsers();
        if (isMounted) setUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Lỗi tải danh sách user:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  const runAction = async (userId, action) => {
    try {
      setActionLoading(userId);
      await action();
      await loadUsers();
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.detail || "Thao tác thất bại");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (user, newRole) => {
    if (user.role === newRole) return;
    if (
      !window.confirm(
        `Bạn có chắc muốn đổi vai trò của ${user.username} thành "${newRole.toUpperCase()}"?`,
      )
    )
      return;
    await runAction(user.id, () => updateUserRole(user.id, newRole));
  };

  const handleBan = async (user) => {
    const message = user.is_banned
      ? `Bạn có chắc muốn mở khóa tài khoản ${user.username}?`
      : `Bạn có chắc muốn khóa tài khoản ${user.username}?`;
    if (!window.confirm(message)) return;
    await runAction(user.id, () => toggleBanUser(user.id));
  };

  const handleHardDelete = async (user) => {
    if (
      !window.confirm(
        `XÓA VĨNH VIỄN tài khoản ${user.username}?\n\nKhông thể khôi phục!`,
      )
    )
      return;
    await runAction(user.id, () => hardDeleteUser(user.id));
  };

  const handlePremium = async (userId, days) => {
    await runAction(userId, () => updatePremium(userId, days));
  };

  const handleCustomPremium = async (userId) => {
    const days = window.prompt("Nhập số ngày Premium:", "30");
    if (days === null) return;
    const totalDays = Number(days);
    if (!Number.isInteger(totalDays) || totalDays <= 0) {
      alert("Số ngày không hợp lệ");
      return;
    }
    await handlePremium(userId, totalDays);
  };

  const handleLifetime = async (userId) => {
    if (!window.confirm("Cấp Premium trọn đời cho tài khoản này?")) return;
    await runAction(userId, () => updatePremium(userId, 0, true));
  };

  const handleRemovePremium = async (user) => {
    if (!window.confirm(`Tước quyền Premium của ${user.username}?`)) return;
    await runAction(user.id, () => removePremium(user.id));
  };

  // Mở Modal Streaming và gán thông tin mặc định của user
  const handleOpenStreamingModal = (user) => {
    setStreamingModal({
      isOpen: true,
      user: user,
      maxScreens: user.max_screens || 1,
      videoQuality: user.video_quality || "1080p",
      adFree: user.ad_free || false,
      canDownload: user.can_download || false,
    });
  };

  const handleCloseStreamingModal = () => {
    setStreamingModal({
      isOpen: false,
      user: null,
      maxScreens: 1,
      videoQuality: "1080p",
      adFree: false,
      canDownload: false,
    });
  };

  // Lưu thông số Streaming từ Modal
  const handleSaveStreaming = async () => {
    const { user, maxScreens, videoQuality, adFree, canDownload } =
      streamingModal;
    if (!user) return;

    const totalScreens = Number(maxScreens);
    if (!Number.isInteger(totalScreens) || totalScreens < 0) {
      alert("Số màn hình không hợp lệ");
      return;
    }

    handleCloseStreamingModal();

    await runAction(user.id, () =>
      updateStreaming(user.id, {
        max_screens: totalScreens,
        video_quality: videoQuality,
        ad_free: adFree,
        can_download: canDownload,
      }),
    );
  };

  const closeHistory = () => {
    setHistoryUser(null);
    setHistoryData([]);
  };

  const handleViewHistory = async (selectedUser) => {
    if (historyUser && String(historyUser.id) === String(selectedUser.id)) {
      closeHistory();
      return;
    }

    try {
      setHistoryUser(selectedUser);
      setHistoryLoading(true);
      const data = await getUserHistory(selectedUser.id);
      if (Array.isArray(data)) {
        setHistoryData(data);
      } else if (Array.isArray(data?.data)) {
        setHistoryData(data.data);
      } else {
        setHistoryData([]);
      }
    } catch (error) {
      console.error("Lỗi lấy lịch sử:", error);
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const keyword = search.toLowerCase();
    const matchSearch =
      user.username?.toLowerCase().includes(keyword) ||
      user.email?.toLowerCase().includes(keyword) ||
      String(user.id).includes(keyword);

    if (!matchSearch) return false;
    if (selectedStat === "premium") return user.is_premium;
    if (selectedStat === "banned") return user.is_banned;
    if (selectedStat === "admin") return user.role === "admin";
    if (selectedStat === "moderator") return user.role === "moderator";
    return true;
  });

  const premiumCount = users.filter((user) => user.is_premium).length;
  const bannedCount = users.filter((user) => user.is_banned).length;
  const adminCount = users.filter((user) => user.role === "admin").length;
  const modCount = users.filter((user) => user.role === "moderator").length;

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">Đang tải dữ liệu quản trị...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-title">
          <div className="admin-icon">⚙️</div>
          <div>
            <h1>Quản trị MovieHub</h1>
            <p>Quản lý tài khoản, Premium và quyền xem phim</p>
          </div>
        </div>

        <button className="reload-btn" onClick={loadUsers}>
          ↻ Làm mới
        </button>
      </div>

      <div className="admin-stats">
        <button
          className={`stat-card ${selectedStat === "all" ? "selected" : ""}`}
          onClick={() => setSelectedStat("all")}
        >
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <span>Tổng tài khoản</span>
            <h2>{users.length}</h2>
          </div>
        </button>

        <button
          className={`stat-card premium-card ${selectedStat === "premium" ? "selected" : ""}`}
          onClick={() => setSelectedStat("premium")}
        >
          <div className="stat-icon"></div>
          <div className="stat-info">
            <span>Premium</span>
            <h2>{premiumCount}</h2>
          </div>
        </button>

        <button
          className={`stat-card banned-card ${selectedStat === "banned" ? "selected" : ""}`}
          onClick={() => setSelectedStat("banned")}
        >
          <div className="stat-icon">🔒</div>
          <div className="stat-info">
            <span>Đã khóa</span>
            <h2>{bannedCount}</h2>
          </div>
        </button>

        <button
          className={`stat-card admin-card ${selectedStat === "admin" ? "selected" : ""}`}
          onClick={() => setSelectedStat("admin")}
        >
          <div className="stat-icon">🛡️</div>
          <div className="stat-info">
            <span>Admin</span>
            <h2>{adminCount}</h2>
          </div>
        </button>

        <button
          className={`stat-card mod-card ${selectedStat === "moderator" ? "selected" : ""}`}
          onClick={() => setSelectedStat("moderator")}
        >
          <div className="stat-icon">👮</div>
          <div className="stat-info">
            <span>Moderator</span>
            <h2>{modCount}</h2>
          </div>
        </button>
      </div>

      <div className="admin-toolbar">
        <div className="search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Tìm theo ID, tên hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="user-count">
          Hiển thị <strong>{filteredUsers.length}</strong> / {users.length} tài
          khoản
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Người dùng</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Gói tài khoản</th>
              <th>Trạng thái</th>
              <th>Quyền xem</th>
              <th>Quản lý</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-users">
                  Không tìm thấy tài khoản
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const isProcessing = actionLoading === user.id;

                return (
                  <tr key={user.id}>
                    <td>
                      <span className="user-id">#{user.id}</span>
                    </td>

                    <td>
                      <div
                        className="user-profile"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <img
                          src={
                            user.avatar
                              ? formatAvatarSrc(user.avatar)
                              : "https://ui-avatars.com/api/?name=" +
                                encodeURIComponent(user.username) +
                                "&background=0D8ABC&color=fff"
                          }
                          alt={user.username}
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "https://ui-avatars.com/api/?name=" +
                              encodeURIComponent(user.username) +
                              "&background=0D8ABC&color=fff";
                          }}
                        />
                        <strong>{user.username}</strong>
                      </div>
                    </td>

                    <td className="user-email">{user.email}</td>

                    <td>
                      <select
                        className={`role-select ${user.role}`}
                        value={user.role || "user"}
                        disabled={isProcessing || isMod}
                        onChange={(e) => handleRoleChange(user, e.target.value)}
                      >
                        <option value="user">👤 User</option>
                        <option value="moderator">🛡️ Moderator</option>
                        <option value="admin"> Admin</option>
                      </select>
                    </td>

                    <td>
                      {user.is_premium ? (
                        <div className="premium-info">
                          <span className="badge premium"> PREMIUM</span>
                          {user.premium_expired_at && (
                            <small>
                              Hết hạn: {formatDate(user.premium_expired_at)}
                            </small>
                          )}
                        </div>
                      ) : (
                        <span className="badge normal">FREE</span>
                      )}
                    </td>

                    <td>
                      {user.is_banned ? (
                        <span className="badge banned">🔒 ĐÃ KHÓA</span>
                      ) : (
                        <span className="badge active">● HOẠT ĐỘNG</span>
                      )}
                    </td>

                    <td>
                      <div className="permission-info">
                        <span>
                          {user.is_premium
                            ? " Xem tất cả phim"
                            : "🎬 Chỉ phim Free"}
                        </span>
                        <span>📺 {user.max_screens || 1} màn hình</span>
                        <span>🎞️ {user.is_premium ? "1080p" : "480p"}</span>
                      </div>
                    </td>

                    <td>
                      <div className="admin-actions">
                        <button
                          className="btn premium-btn"
                          disabled={isProcessing}
                          onClick={() => handleCustomPremium(user.id)}
                        >
                          + Ngày
                        </button>

                        <button
                          className="btn lifetime"
                          disabled={isProcessing}
                          onClick={() => handleLifetime(user.id)}
                        >
                          Trọn đời
                        </button>

                        {user.is_premium && (
                          <button
                            className="btn remove"
                            disabled={isProcessing}
                            onClick={() => handleRemovePremium(user)}
                          >
                            Tước
                          </button>
                        )}

                        <button
                          className="btn streaming"
                          disabled={isProcessing}
                          onClick={() => handleOpenStreamingModal(user)}
                        >
                          📺 Streaming
                        </button>

                        <button
                          className={`btn history ${
                            historyUser &&
                            String(historyUser.id) === String(user.id)
                              ? "history-active"
                              : ""
                          }`}
                          disabled={isProcessing}
                          onClick={() => handleViewHistory(user)}
                        >
                          {historyUser &&
                          String(historyUser.id) === String(user.id)
                            ? "✕ Đóng lịch sử"
                            : "🕒 Lịch sử xem"}
                        </button>

                        <button
                          className="btn ban"
                          disabled={isProcessing}
                          onClick={() => handleBan(user)}
                        >
                          {user.is_banned ? "🔓 Mở khóa" : "🔒 Khóa"}
                        </button>

                        <button
                          className="btn delete"
                          disabled={isProcessing || isMod}
                          onClick={() => handleHardDelete(user)}
                        >
                          🗑 Xóa vĩnh viễn
                        </button>
                      </div>

                      {isProcessing && (
                        <div className="processing">Đang xử lý...</div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL STREAMING */}
      {streamingModal.isOpen && (
        <div
          className="admin-modal-overlay"
          onClick={handleCloseStreamingModal}
        >
          <div
            className="history-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "450px" }}
          >
            <div className="modal-header">
              <div>
                <h2>📺 Cấu hình Streaming</h2>
                <p>
                  Tài khoản: <strong>{streamingModal.user?.username}</strong>
                </p>
              </div>
              <button className="close-btn" onClick={handleCloseStreamingModal}>
                ×
              </button>
            </div>

            <div
              style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "14px",
                    color: "#aaa",
                  }}
                >
                  Số màn hình xem đồng thời:
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={streamingModal.maxScreens}
                  onChange={(e) =>
                    setStreamingModal((prev) => ({
                      ...prev,
                      maxScreens: e.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #333",
                    background: "#121212",
                    color: "#fff",
                    fontSize: "15px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontSize: "14px",
                    color: "#aaa",
                  }}
                >
                  Chất lượng xem tối đa:
                </label>
                <select
                  value={streamingModal.videoQuality}
                  onChange={(e) =>
                    setStreamingModal((prev) => ({
                      ...prev,
                      videoQuality: e.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #333",
                    background: "#121212",
                    color: "#fff",
                    fontSize: "15px",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="480p">480p</option>
                  <option value="720p">720p</option>
                  <option value="1080p">1080p</option>
                  <option value="4K">4K</option>
                </select>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  marginTop: "6px",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={streamingModal.adFree}
                    onChange={(e) =>
                      setStreamingModal((prev) => ({
                        ...prev,
                        adFree: e.target.checked,
                      }))
                    }
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <span>Không quảng cáo (Ad-free)</span>
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={streamingModal.canDownload}
                    onChange={(e) =>
                      setStreamingModal((prev) => ({
                        ...prev,
                        canDownload: e.target.checked,
                      }))
                    }
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <span>Cho phép tải phim</span>
                </label>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
                <button
                  type="button"
                  onClick={handleCloseStreamingModal}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "none",
                    background: "#333",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveStreaming}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "none",
                    background: "#e50914",
                    color: "#fff",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  Lưu thiết lập
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LỊCH SỬ XEM */}
      {historyUser && (
        <div className="admin-modal-overlay" onClick={closeHistory}>
          <div className="history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>🕒 Lịch sử xem phim</h2>
                <p>
                  Tài khoản: <strong>{historyUser.username}</strong>
                </p>
              </div>
              <button className="close-btn" onClick={closeHistory}>
                ×
              </button>
            </div>

            {historyLoading ? (
              <div className="history-loading">Đang tải lịch sử...</div>
            ) : historyData.length === 0 ? (
              <div className="history-empty">
                🎬 Người dùng chưa xem phim nào.
              </div>
            ) : (
              <div className="history-list">
                {historyData.map((item) => (
                  <div className="history-item" key={item.id}>
                    <img
                      src={
                        item.poster_url?.startsWith("http")
                          ? item.poster_url
                          : `https://moviehub-backend-ln1c.onrender.com${item.poster_url}`
                      }
                      alt={item.title}
                      className="history-poster"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          "https://placehold.co/100x150?text=No+Poster";
                      }}
                    />
                    <div className="history-info">
                      <h3>{item.title}</h3>
                      <p>
                        ⏱️{" "}
                        {item.watched_at
                          ? formatDate(item.watched_at)
                          : "Chưa xác định"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
