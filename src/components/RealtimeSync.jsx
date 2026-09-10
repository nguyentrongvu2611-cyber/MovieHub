import { useEffect } from "react";

export default function RealtimeSync() {
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) return;

    let user;
    try {
      user = JSON.parse(savedUser);
    } catch {
      return;
    }

    if (!user?.id) return;

    const API_BASE_URL =
      import.meta.env.VITE_API_BASE_URL ||
      "https://moviehub-backend-ln1c.onrender.com/api/v1";

    const eventSource = new EventSource(
      `${API_BASE_URL}/auth/stream/${user.id}`
    );

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "USER_STATUS_UPDATED") {
          const { is_premium, role } = payload.data;
          const currentUser = JSON.parse(
            localStorage.getItem("user") || "{}"
          );

          if (
            currentUser.is_premium !== is_premium ||
            currentUser.role !== role
          ) {
            const updatedUser = {
              ...currentUser,
              is_premium,
              role,
            };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            window.dispatchEvent(new Event("userChanged"));

            if (!is_premium && currentUser.is_premium) {
              alert("⚠️ Quyền Premium của bạn đã bị hủy hoặc hết hạn.");
            } else if (is_premium && !currentUser.is_premium) {
              alert("🎉 Tài khoản của bạn đã được nâng cấp lên Premium!");
            }
          }
        }
      } catch (err) {
        console.error("Lỗi đọc dữ liệu SSE:", err);
      }
    };

    eventSource.onerror = (err) => {
      // Khi mất kết nối hoặc Render timeout, chỉ ghi log cảnh báo
      console.warn("SSE connection issue, reconnecting...", err);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return null;
}