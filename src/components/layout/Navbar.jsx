import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { searchMovies } from "../../features/movies/movieService";
import "./Navbar.css";

const BACKEND_URL = "http://127.0.0.1:8000";

function Navbar() {
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const years = Array.from({ length: 2026 - 2000 + 1 }, (_, i) => 2026 - i);

  useEffect(() => {
    const updateUser = () => {
      const savedUser = localStorage.getItem("user");
      setUser(savedUser ? JSON.parse(savedUser) : null);
    };

    window.addEventListener("userChanged", updateUser);
    return () => {
      window.removeEventListener("userChanged", updateUser);
    };
  }, []);

  useEffect(() => {
    const search = async () => {
      if (!keyword.trim()) {
        setResults([]);
        setShowResults(false);
        return;
      }

      try {
        const data = await searchMovies(keyword);
        setResults(data.slice(0, 8));
        setShowResults(true);
      } catch (error) {
        console.error("Lỗi tìm kiếm:", error);
      }
    };

    const timeout = setTimeout(search, 300);
    return () => clearTimeout(timeout);
  }, [keyword]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setShowResults(false);
    navigate(`/search?q=${encodeURIComponent(keyword.trim())}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("userChanged"));
    navigate("/");
  };

  // 💥 XỬ LÝ CLICK VÀO CHỮ PREMIUM
  const handlePremiumClick = (e) => {
    e.preventDefault();
    
    // Kiểm tra cờ is_premium hoặc role của user
    const isPremiumUser = user && (user.is_premium || user.role === "premium");

    if (isPremiumUser) {
      navigate("/my-subscription"); // Chuyển đến trang thông tin gói
    } else {
      navigate("/premium"); // Chuyển đến trang đăng ký gói
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-top">
        <Link to="/" className="logo">
          MOVIEHUB
        </Link>

        {/* MAIN MENU */}
        <nav className="main-menu">
          <Link to="/movies?type=single">Phim Lẻ</Link>
          <Link to="/movies?type=series">Phim Bộ</Link>

          {/* DROPDOWN THỂ LOẠI */}
          <div className="menu-dropdown">
            <button type="button">Thể Loại ▾</button>
            <div className="dropdown-content grid-3-cols">
              <Link to="/movies?genre=action">Hành Động</Link>
              <Link to="/movies?genre=romance">Tình Cảm</Link>
              <Link to="/movies?genre=comedy">Hài Hước</Link>
              <Link to="/movies?genre=historical">Cổ Trang</Link>
              <Link to="/movies?genre=drama">Tâm Lý</Link>
              <Link to="/movies?genre=crime">Hình Sự</Link>
              <Link to="/movies?genre=war">Chiến Tranh</Link>
              <Link to="/movies?genre=sport">Thể Thao</Link>
              <Link to="/movies?genre=martial-arts">Võ Thuật</Link>
              <Link to="/movies?genre=fantasy">Viễn Tưởng</Link>
              <Link to="/movies?genre=adventure">Phiêu Lưu</Link>
              <Link to="/movies?genre=horror">Kinh Dị</Link>
              <Link to="/movies?genre=animation">Anime & Hoạt Hình</Link>
            </div>
          </div>

          {/* DROPDOWN QUỐC GIA */}
          <div className="menu-dropdown">
            <button type="button">Quốc Gia ▾</button>
            <div className="dropdown-content grid-2-cols">
              <Link to="/movies?country=china">Trung Quốc</Link>
              <Link to="/movies?country=korea">Hàn Quốc</Link>
              <Link to="/movies?country=japan">Nhật Bản</Link>
              <Link to="/movies?country=thailand">Thái Lan</Link>
              <Link to="/movies?country=usa">Âu Mỹ</Link>
              <Link to="/movies?country=india">Ấn Độ</Link>
              <Link to="/movies?country=vietnam">Việt Nam</Link>
            </div>
          </div>

          {/* DROPDOWN NĂM PHÁT HÀNH */}
          <div className="menu-dropdown">
            <button type="button">Năm Phát Hành ▾</button>
            <div className="dropdown-content grid-year">
              {years.map((year) => (
                <Link key={year} to={`/movies?year=${year}`}>
                  {year}
                </Link>
              ))}
            </div>
          </div>

          {/* DROPDOWN CHỦ ĐỀ PHIM */}
          <div className="menu-dropdown">
            <button type="button">Chủ Đề Phim ▾</button>
            <div className="dropdown-content">
              <Link to="/movies?topic=cinema">Phim Chiếu Rạp</Link>
              <Link to="/movies?topic=dubbed">Phim Thuyết Minh</Link>
              <Link to="/movies?topic=voice">Phim Lồng Tiếng</Link>
              <Link to="/movies?topic=trailer">Phim Trailer</Link>
              <Link to="/movies?topic=hot-week">Phim Hot Trong Tuần</Link>
              <Link to="/movies?topic=completed">Phim Bộ Hoàn Thành</Link>
            </div>
          </div>

          {user && <Link to="/my-list">Danh sách của tôi</Link>}
          
          {/* 💥 THAY ĐỔI TẠI ĐÂY */}
          <a
            href="/premium"
            onClick={handlePremiumClick}
            className="premium-nav-link"
          >
            Premium
          </a>
        </nav>

        {/* TÌM KIẾM VÀ TÀI KHOẢN */}
        <div className="navbar-actions">
          <div className="search-container">
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Tìm kiếm phim..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onFocus={() => {
                  if (keyword.trim()) {
                    setShowResults(true);
                  }
                }}
              />
            </form>

            {showResults && (
              <div className="search-results">
                {results.length > 0 ? (
                  results.map((movie) => {
                    const rawPoster =
                      movie.poster_url ||
                      movie.poster ||
                      movie.thumb_url ||
                      movie.posterUrl;

                    let finalPosterUrl =
                      "https://placehold.co/45x65/282828/FFF?text=No+Img";

                    if (rawPoster) {
                      if (
                        rawPoster.startsWith("http://") ||
                        rawPoster.startsWith("https://")
                      ) {
                        finalPosterUrl = rawPoster;
                      } else {
                        const cleanPath = rawPoster.startsWith("/")
                          ? rawPoster
                          : `/${rawPoster}`;
                        finalPosterUrl = `${BACKEND_URL}${cleanPath}`;
                      }
                    }

                    return (
                      <Link
                        key={movie.id || movie._id}
                        to={`/movie/${movie.id || movie._id}`}
                        className="search-item"
                        onClick={() => {
                          setKeyword("");
                          setShowResults(false);
                        }}
                      >
                        <img
                          src={finalPosterUrl}
                          alt={movie.title || movie.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "https://placehold.co/45x65/282828/FFF?text=No+Img";
                          }}
                        />
                        <div className="search-item-info">
                          <span className="search-item-title">
                            {movie.title || movie.name}
                          </span>
                          {movie.year && (
                            <span className="search-item-year">
                              ({movie.year})
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="no-result">Không tìm thấy phim</div>
                )}
              </div>
            )}
          </div>

          {user ? (
            <div className="user-dropdown">
              <button
                type="button"
                className="user-trigger"
                onClick={() => navigate("/profile")}
              >
                👤 {user.username || user.name}
              </button>

              <div className="user-dropdown-menu">
                <button
                  type="button"
                  className="profile-btn"
                  onClick={() => navigate("/profile")}
                >
                  👤 Thông tin tài khoản
                </button>

                {user.role === "admin" && (
                  <button
                    type="button"
                    className="admin-btn"
                    onClick={() => navigate("/admin")}
                  >
                    ⚙️ Quản lý tài khoản
                  </button>
                )}

                {(user.role === "admin" || user.role === "moderator") && (
                  <>
                    <button
                      type="button"
                      className="admin-btn"
                      onClick={() => navigate("/movie-management")}
                    >
                      🎬 Quản lý phim
                    </button>
                    <button
                      type="button"
                      className="admin-btn"
                      onClick={() => navigate("/home-management")}
                    >
                      🏠 Cấu hình trang chủ
                    </button>
                  </>
                )}

                <button
                  type="button"
                  className="logout-btn"
                  onClick={handleLogout}
                >
                  🚪 Đăng xuất
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="login-btn">
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;