import api from "./api";

// 1. Đăng ký tài khoản tới FastAPI
export const registerUser = async (userData) => {
  const response = await api.post("/register", {
    username: userData.username || userData.email, // backend cần username
    email: userData.email,
    password: userData.password,
  });
  return response.data;
};

// 2. Đăng nhập (Backend sẽ tự động set-cookie access_token)
export const loginUser = async (username, password) => {
  const response = await api.post("/login", {
    username: username,
    password: password,
  });

  // Chỉ lưu thông tin cơ bản của user vào localStorage (NẾU CẦN để hiển thị tên/avatar)
  // Tuyệt đối KHÔNG lưu access_token vào đây nữa
  if (response.data.user) {
    localStorage.setItem("user", JSON.stringify(response.data.user));
  }

  return response.data;
};

// 3. Đăng xuất (Gọi API để xóa Cookie phía Backend + Xóa localStorage)
export const logoutUser = async () => {
  try {
    await api.post("/logout");
  } catch (error) {
    console.error("Lỗi đăng xuất:", error);
  } finally {
    localStorage.removeItem("user");
  }
};