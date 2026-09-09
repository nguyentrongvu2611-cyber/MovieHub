import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Component Real-time SSE
import RealtimeSync from "./components/RealtimeSync";

// Layout
import MainLayout from "./layouts/MainLayout";

// Features: Movies
import Home from "./features/movies/pages/Home";
import Movies from "./features/movies/pages/Movies";
import MovieDetail from "./features/movies/pages/MovieDetail";
import Watch from "./features/movies/pages/Watch";
import MovieManagement from "./features/movies/pages/MovieManagement";

// Features: Auth
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import ForgotPassword from "./features/auth/pages/ForgotPassword";
import ResetPassword from "./features/auth/pages/ResetPassword";

// Features: Admin & Moderator
import Admin from "./features/admin/pages/Admin";
import HomeManagement from "./features/admin/pages/HomeManagement";
import Moderator from "./features/admin/pages/Moderator";

// Features: User & Watchlist
import Profile from "./features/user/pages/Profile";
import MyList from "./features/watchlist/pages/MyList";

// Features: Payment
import Premium from "./features/payment/pages/Premium";
import Payment from "./features/payment/pages/Payment";
import MySubscription from "./pages/subscription/MySubscription";

// Component bảo vệ Route theo Role
const ProtectedRoute = ({ allowedRoles, children }) => {
  const userString = localStorage.getItem("user");
  const currentUser = userString ? JSON.parse(userString) : null;

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    alert("Bạn không có quyền truy cập vào trang này!");
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <>
      {/* ToastContainer duy nhất cho toàn bộ hệ thống */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />

      {/* Lắng nghe sự kiện SSE real-time từ Backend */}
      <RealtimeSync />

      <Routes>
        {/* Layout chính có Header / Footer */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
          <Route path="/watch/:id" element={<Watch />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/my-list" element={<MyList />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/my-subscription" element={<MySubscription />} />

          <Route
            path="/moderator"
            element={
              <ProtectedRoute allowedRoles={["admin", "moderator"]}>
                <Moderator />
              </ProtectedRoute>
            }
          />

          {/* Quản lý User: Chỉ dành riêng cho ADMIN */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Admin />
              </ProtectedRoute>
            }
          />

          {/* Quản lý Phim: ADMIN & MODERATOR */}
          <Route
            path="/movie-management"
            element={
              <ProtectedRoute allowedRoles={["admin", "moderator"]}>
                <MovieManagement />
              </ProtectedRoute>
            }
          />

          {/* Quản lý Trang chủ: ADMIN & MODERATOR */}
          <Route
            path="/home-management"
            element={
              <ProtectedRoute allowedRoles={["admin", "moderator"]}>
                <HomeManagement />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Các trang Authentication độc lập */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </>
  );
}

export default App;