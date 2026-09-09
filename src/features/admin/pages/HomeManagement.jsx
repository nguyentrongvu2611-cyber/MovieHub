import { useState, useEffect, useRef } from "react";
import api from "../../../services/api";
import "./HomeManagement.css";

const SECTIONS = [
  {
    id: "trending",
    title: "🔥 Phim Thịnh Hành",
    desc: "Hiển thị ở khu vực Banner & Phim Hot",
  },
  {
    id: "cinema",
    title: "🎬 Phim Chiếu Rạp",
    desc: "Danh sách phim bom tấn chiếu rạp",
  },
  { id: "single", title: "📼 Phim Lẻ Mới", desc: "Danh sách phim lẻ cập nhật" },
  {
    id: "anime",
    title: "🐲 Phim Hoạt Hình & Anime",
    desc: "Mục phim anime nổi bật",
  },
];

const removeVietnameseTones = (str) => {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
};

// Hàm xử lý đường dẫn Poster thông minh
const getPosterUrl = (movie) => {
  if (!movie) return "https://placehold.co/120x170/1a1d2e/64748b?text=No+Cover";

  // Lấy đường dẫn ảnh từ tất cả các biến tên có thể xảy ra
  const path =
    movie.url ||
    movie.poster_url ||
    movie.poster ||
    movie.thumb_url ||
    movie.poster_path;

  if (!path) return "https://placehold.co/120x170/1a1d2e/64748b?text=No+Cover";

  // Nếu đã là link đầy đủ (http://...)
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  // Ghép Domain Backend vào đường dẫn tương đối (/uploads/...)
  const baseUrl = "http://127.0.0.1:8000";
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `${baseUrl}${cleanPath}`;
};

function HomeManagement() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState({});
  const [activeDropdown, setActiveDropdown] = useState(null);

  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchMovies = async () => {
      try {
        const res = await api.get("/movies");
        if (isMounted) {
          const movieList = Array.isArray(res.data)
            ? res.data
            : res.data?.data || res.data?.movies || res.data?.result || [];

          // Debug dữ liệu nhận về trong F12 Console
          console.log("Danh sách phim từ Backend:", movieList);
          setMovies(movieList);
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách phim:", error);
        if (isMounted) setMovies([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMovies();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdateSection = async (movieId, newSection) => {
    try {
      await api.patch(`/movies/${movieId}`, { section_type: newSection });
      setMovies((prev) =>
        prev.map((m) =>
          m.id === movieId ? { ...m, section_type: newSection } : m,
        ),
      );
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      alert("Cập nhật thất bại!");
    }
  };

  const handleSelectMovie = (movieId, sectionId) => {
    handleUpdateSection(movieId, sectionId);
    setSearchQuery((prev) => ({ ...prev, [sectionId]: "" }));
    setActiveDropdown(null);
  };

  if (loading) {
    return <div className="loading-text">🎬 Đang tải danh sách phim...</div>;
  }

  return (
    <div className="home-management-container" ref={containerRef}>
      <div className="header-title">
        <h2>🏠 Cấu Hình Hiển Thị Trang Chủ</h2>
        <p>
          Tìm kiếm và chọn các phim nổi bật để sắp xếp vào từng danh mục trên
          trang chủ
        </p>
      </div>

      <div className="sections-grid">
        {SECTIONS.map((sec) => {
          const sectionMovies = movies.filter((m) => m.section_type === sec.id);
          const rawQuery = (searchQuery[sec.id] || "").trim().toLowerCase();
          const cleanQuery = removeVietnameseTones(rawQuery);

          const searchResults = movies.filter((m) => {
            const isNotInThisSection = m.section_type !== sec.id;
            const rawTitle = (
              m.title ||
              m.name ||
              m.movie_name ||
              ""
            ).toLowerCase();
            const cleanTitle = removeVietnameseTones(rawTitle);
            return (
              isNotInThisSection &&
              (rawTitle.includes(rawQuery) || cleanTitle.includes(cleanQuery))
            );
          });

          return (
            <div key={sec.id} className="section-box">
              <div className="section-header">
                <div>
                  <h3>{sec.title}</h3>
                  <p className="section-desc">{sec.desc}</p>
                </div>
                <span className="count-badge">{sectionMovies.length} phim</span>
              </div>

              {/* TÌM KIẾM AUTOCOMPLETE */}
              <div className="search-autocomplete-wrapper">
                <input
                  type="text"
                  placeholder="🔍 Nhập tên phim để tìm..."
                  value={searchQuery[sec.id] || ""}
                  onChange={(e) => {
                    setSearchQuery((prev) => ({
                      ...prev,
                      [sec.id]: e.target.value,
                    }));
                    setActiveDropdown(sec.id);
                  }}
                  onFocus={() => setActiveDropdown(sec.id)}
                  className="search-input"
                />

                {activeDropdown === sec.id && rawQuery.length > 0 && (
                  <div className="autocomplete-dropdown">
                    {searchResults.length > 0 ? (
                      searchResults.slice(0, 6).map((movie) => (
                        <div
                          key={movie.id}
                          className="autocomplete-item"
                          onClick={() => handleSelectMovie(movie.id, sec.id)}
                        >
                          <img
                            src={getPosterUrl(movie)}
                            alt=""
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                "https://placehold.co/40x60/1a1d2e/64748b?text=No+Img";
                            }}
                          />
                          <div>
                            <strong>
                              {movie.title || movie.name || "Chưa có tên"}
                            </strong>
                            <span>
                              {movie.year || movie.release_year || "N/A"}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-result-item">
                        Không tìm thấy phim phù hợp
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* DANH SÁCH PHIM ĐÃ CHỌN */}
              <div className="movie-grid">
                {sectionMovies.length > 0 ? (
                  sectionMovies.map((movie) => (
                    <div key={movie.id} className="movie-card">
                      {/* Khung chứa ảnh + Nút Xóa hover */}
                      <div className="poster-wrapper">
                        <img
                          src={getPosterUrl(movie)}
                          alt={movie.title || movie.name}
                          className="movie-poster"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "https://placehold.co/120x170/1a1d2e/64748b?text=No+Cover";
                          }}
                        />
                        {/* Nút Xóa góc trên bên phải khi hover */}
                        <button
                          type="button"
                          onClick={() => handleUpdateSection(movie.id, "none")}
                          className="delete-hover-btn"
                          title="Xóa khỏi danh mục"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Tên phim phía dưới */}
                      <div className="movie-info">
                        <strong title={movie.title || movie.name}>
                          {movie.title || movie.name}
                        </strong>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-box">
                    Chưa chọn phim nào cho mục này
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default HomeManagement;
