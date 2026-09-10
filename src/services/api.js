import axios from "axios";

// Base URL kết nối tới Backend trên Render
const api = axios.create({
  baseURL: "https://moviehub-backend-ln1c.onrender.com/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor gửi đính kèm Token trong mọi Request
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("access_token") || localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor xử lý Lỗi Hệ thống & Hết hạn Token (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Đọc toàn bộ hash path để nhận biết chính xác trang login trên HashRouter
      const currentHash = window.location.hash; 

      // Chỉ kích hoạt Logout/Redirect nếu 401 không xuất hiện ở trang /login
      if (!currentHash.includes("/login")) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
        
        // Điều hướng an toàn hỗ trợ cả Localhost và GitHub Pages
        window.location.href = window.location.origin + window.location.pathname + "#/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;