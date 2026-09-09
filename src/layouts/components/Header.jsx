import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

import { logout } from "../../features/auth/authSlice";
import "./Header.css";

function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Lấy thông tin user và trạng thái đăng nhập từ Redux Store
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [keyword, setKeyword] = useState("");

  // Dữ liệu Danh mục Menu
  const categories = [
    { name: "Hành Động", slug: "hanh-dong" },
    { name: "Tình Cảm", slug: "tinh-cam" },
    { name: "Hài Hước", slug: "hai-huoc" },
    { name: "Cổ Trang", slug: "co-trang" },
    { name: "Tâm Lý", slug: "tam-ly" },
    { name: "Hình Sự", slug: "hinh-su" },
    { name: "Chiến Tranh", slug: "chien-tranh" },
    { name: "Thể Thao", slug: "the-thao" },
    { name: "Võ Thuật", slug: "vo-thuat" },
    { name: "Viễn Tưởng", slug: "vien-tuong" },
    { name: "Phiêu Lưu", slug: "phieu-luu" },
    { name: "Kinh Dị", slug: "kinh-di" },
    { name: "Anime & Hoạt Hình", slug: "hoat-hinh" }
  ];

  const countries = [
    { name: "Trung Quốc", slug: "trung-quoc" },
    { name: "Hàn Quốc", slug: "han-quoc" },
    { name: "Nhật Bản", slug: "nhat-ban" },
    { name: "Thái Lan", slug: "thai-lan" },
    { name: "Âu Mỹ", slug: "au-my" },
    { name: "Ấn Độ", slug: "an-do" }
  ];

  const topics = [
    { name: "Phim Chiếu Rạp", slug: "phim-chieu-rap" },
    { name: "Phim Thuyết Minh", slug: "thuyet-minh" },
    { name: "Phim Lồng Tiếng", slug: "long-tieng" },
    { name: "Phim Hot Trong Tuần", slug: "phim-hot" },
    { name: "Phim Bộ Hoàn Thành", slug: "hoan-thanh" }
  ];

  // Tạo mảng năm tự động từ 2026 về 2000
  const years = Array.from({ length: 2026 - 2000 + 1 }, (_, i) => 2026 - i);

  // Xử lý gửi Form tìm kiếm (Sử dụng biến navigate)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    navigate(`/movies?q=${encodeURIComponent(keyword.trim())}`);
    setKeyword("");
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/" className="logo">
          MOVIEHUB
        </Link>

        <nav className="nav">
          <NavLink to="/">Trang chủ</NavLink>
          <NavLink to="/movies?type=single">Phim Lẻ</NavLink>
          <NavLink to="/movies?type=series">Phim Bộ</NavLink>

          {/* DROPDOWN THỂ LOẠI */}
          <div className="nav-dropdown">
            <button className="dropdown-btn" type="button">
              Thể loại ▾
            </button>
            <div className="dropdown-menu grid-3-cols">
              {categories.map((cat) => (
                <Link key={cat.slug} to={`/movies?category=${cat.slug}`}>
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          {/* DROPDOWN QUỐC GIA */}
          <div className="nav-dropdown">
            <button className="dropdown-btn" type="button">
              Quốc gia ▾
            </button>
            <div className="dropdown-menu grid-2-cols">
              {countries.map((c) => (
                <Link key={c.slug} to={`/movies?country=${c.slug}`}>
                  {c.name}
                </Link>
              ))}
            </div>
          </div>

          {/* DROPDOWN NĂM PHÁT HÀNH */}
          <div className="nav-dropdown">
            <button className="dropdown-btn" type="button">
              Năm ▾
            </button>
            <div className="dropdown-menu grid-year">
              {years.map((year) => (
                <Link key={year} to={`/movies?year=${year}`}>
                  {year}
                </Link>
              ))}
            </div>
          </div>

          {/* DROPDOWN CHỦ ĐỀ PHIM */}
          <div className="nav-dropdown">
            <button className="dropdown-btn" type="button">
              Chủ đề ▾
            </button>
            <div className="dropdown-menu">
              {topics.map((t) => (
                <Link key={t.slug} to={`/movies?topic=${t.slug}`}>
                  {t.name}
                </Link>
              ))}
            </div>
          </div>

          {isAuthenticated && (
            <NavLink to="/my-list">Danh sách của tôi</NavLink>
          )}
        </nav>
      </div>

      <div className="header-right">
        <form className="header-search" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Tìm phim..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </form>

        {isAuthenticated ? (
          <div className="user-section">
            {/* Sử dụng biến user để khắc phục lỗi ESLint */}
            <span className="user-name">
              👤 {user?.name || user?.username || "Thành viên"}
            </span>
            <button
              type="button"
              className="logout-btn"
              onClick={handleLogout}
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          <Link to="/login" className="login-btn">
            Đăng nhập
          </Link>
        )}
      </div>
    </header>
  );
}

export default Header;