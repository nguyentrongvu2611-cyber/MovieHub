import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

import api from "../../../services/api";

import { getMovieById } from "../movieService";

import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} from "../../watchlist/watchlistService";

import "./MovieDetail.css";

const API_BASE_URL =
  api.defaults.baseURL || "https://moviehub-backend-ln1c.onrender.com";

// Hàm hỗ trợ lấy User mới nhất từ LocalStorage
const getCurrentUser = () => {
  const savedUser = localStorage.getItem("user");
  return savedUser ? JSON.parse(savedUser) : null;
};

function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Khai báo user 1 lần duy nhất ở đây
  const user = getCurrentUser();

  const [movie, setMovie] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // State điều khiển hiển thị Modal Premium
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // 1. Tải danh sách Thể loại
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await api.get("/categories/");
        const data = Array.isArray(response.data)
          ? response.data
          : response.data.categories || [];
        setCategories(data);
      } catch (error) {
        console.error("Lỗi tải danh sách thể loại:", error);
      }
    }

    fetchCategories();
  }, []);

  // 2. Tải chi tiết phim
  useEffect(() => {
    async function loadMovie() {
      try {
        setLoading(true);
        const data = await getMovieById(id);
        setMovie(data);
      } catch (error) {
        console.error("Lỗi tải chi tiết phim:", error);
      } finally {
        setLoading(false);
      }
    }

    loadMovie();
  }, [id]);

  // 3. Kiểm tra trạng thái yêu thích
  useEffect(() => {
    let isMounted = true;

    async function checkFavorite() {
      if (!user?.id || !id) {
        setIsFavorite(false);
        return;
      }

      try {
        const watchlist = await getWatchlist(user.id);
        const exists = watchlist.some(
          (item) => String(item.movie_id || item.id) === String(id),
        );

        if (isMounted) {
          setIsFavorite(exists);
        }
      } catch (error) {
        console.error("Lỗi kiểm tra yêu thích:", error);
      }
    }

    checkFavorite();

    return () => {
      isMounted = false;
    };
  }, [id, user?.id]);

  // 4. Hàm Kiểm tra phim có phải Premium hay không
  const checkIsMoviePremium = (movieData) => {
    if (!movieData) return false;
    if (movieData.is_free !== undefined && movieData.is_free !== null) {
      return (
        movieData.is_free === false ||
        movieData.is_free === "false" ||
        movieData.is_free === 0
      );
    }
    if (movieData.is_premium !== undefined && movieData.is_premium !== null) {
      return (
        movieData.is_premium === true ||
        movieData.is_premium === "true" ||
        movieData.is_premium === 1
      );
    }
    return movieData.access_type === "premium";
  };

  // 5. Xử lý sự kiện bấm nút Xem Phim
  const handleWatchClick = (e) => {
    e.preventDefault();

    const isPremiumUser = Boolean(
      user?.is_premium === true ||
      user?.is_premium === "true" ||
      user?.is_premium === 1 ||
      user?.role === "admin",
    );

    const isMoviePremium = checkIsMoviePremium(movie);

    // Mở Modal Custom ở giữa màn hình nếu không đủ quyền xem
    if (isMoviePremium && !isPremiumUser) {
      setShowPremiumModal(true);
      return;
    }

    navigate(`/watch/${movie.id}`);
  };

  const getCategoryName = (movieData) => {
    if (!movieData) return "Chưa cập nhật";

    if (movieData.category?.name) return movieData.category.name;
    if (typeof movieData.category === "string" && movieData.category.trim()) {
      return movieData.category;
    }
    if (movieData.category_name) return movieData.category_name;
    if (movieData.genre) return movieData.genre;

    const catId = movieData.category_id || movieData.category;
    if (catId) {
      const found = categories.find((c) => String(c.id) === String(catId));
      if (found) return found.name;
    }

    return "Chưa cập nhật";
  };

  const getFullImageUrl = (url) => {
    if (!url) return "https://placehold.co/300x450?text=No+Poster";

    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    const backendOrigin = new URL(API_BASE_URL).origin;
    const cleanUrl = url.replace(/^\/api\/v1/, "");

    return `${backendOrigin}${cleanUrl.startsWith("/") ? "" : "/"}${cleanUrl}`;
  };

  const handleFavorite = async () => {
    if (!user?.id) {
      alert("Vui lòng đăng nhập để thêm phim vào danh sách yêu thích!");
      return;
    }

    try {
      setFavoriteLoading(true);

      if (isFavorite) {
        await removeFromWatchlist(user.id, movie.id);
        setIsFavorite(false);
      } else {
        await addToWatchlist(user.id, movie.id);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Lỗi yêu thích:", error);
      alert(
        error.response?.data?.detail ||
          "Không thể cập nhật danh sách yêu thích",
      );
    } finally {
      setFavoriteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="movie-detail-loading">
        <div className="spinner"></div>
        <span>Đang tải thông tin phim...</span>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="movie-detail-notfound">
        <h2>⚠️ Không tìm thấy phim</h2>
        <p>Phim bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
        <Link to="/" className="back-home-btn">
          ← Quay về trang chủ
        </Link>
      </div>
    );
  }

  const posterSrc = getFullImageUrl(movie.poster_url);
  const isPremiumMovie = checkIsMoviePremium(movie);

  return (
    <div className="movie-detail-wrapper">
      <div
        className="movie-detail-backdrop"
        style={{ backgroundImage: `url(${posterSrc})` }}
      />

      <div className="movie-detail-container">
        <div className="movie-detail-poster">
          <img src={posterSrc} alt={movie.title} />
          <span
            className={`poster-badge ${
              !isPremiumMovie ? "free-badge" : "premium-badge"
            }`}
          >
            {!isPremiumMovie ? "FREE" : " PREMIUM"}
          </span>
        </div>

        <div className="movie-detail-info">
          <h1 className="movie-detail-title">{movie.title}</h1>

          {/* Bảng chi tiết thông tin phim */}
          <div className="movie-info-grid">
            <div className="info-item">
              <span className="info-label">Thể loại:</span>
              <span className="info-value">{getCategoryName(movie)}</span>
            </div>

            <div className="info-item">
              <span className="info-label">Năm phát hành:</span>
              <span className="info-value">
                {movie.year || "Đang cập nhật"}
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">Thời lượng:</span>
              <span className="info-value">
                {movie.duration ? `${movie.duration} phút` : "Đang cập nhật"}
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">Quốc gia:</span>
              <span className="info-value">
                {(() => {
                  // 1. Lấy giá trị chuỗi (xử lý nếu movie.country là object hay string)
                  const countryVal =
                    typeof movie.country === "object"
                      ? movie.country?.name || movie.country?.slug
                      : movie.country;

                  if (!countryVal) return "Âu Mỹ";

                  // 2. Bảng ánh xạ slug/mã quốc gia sang tên tiếng Việt chuẩn
                  const countryMap = {
                    "han-quoc": "Hàn Quốc",
                    "trung-quoc": "Trung Quốc",
                    "nhat-ban": "Nhật Bản",
                    "au-my": "Âu Mỹ",
                    vn: "Việt Nam",
                    "thai-lan": "Thái Lan",
                    "dai-loan": "Đài Loan",
                    "hong-kong": "Hồng Kông",
                    "an-do": "Ấn Độ",
                  };

                  const normalizedKey = countryVal
                    .toString()
                    .toLowerCase()
                    .trim();

                  // Return từ map, nếu không có trong map thì tự động viết hoa chữ cái đầu
                  return (
                    countryMap[normalizedKey] ||
                    countryVal
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())
                  );
                })()}
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">Đạo diễn:</span>
              <span className="info-value">
                {movie.director || "Michael B. Jordan"}
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">Lượt xem:</span>
              <span className="info-value">
                {(movie.views ?? movie.view_count ?? 0).toLocaleString("vi-VN")}{" "}
                lượt
              </span>
            </div>
          </div>

          <div className="movie-description-box">
            <h3>Nội dung phim</h3>
            <p>{movie.description || "Chưa có nội dung mô tả cho phim này."}</p>
          </div>

          <div className="movie-actions">
            <button onClick={handleWatchClick} className="watch-button">
              <span className="play-icon">▶</span> Xem phim
            </button>

            <button
              className={`favorite-button ${isFavorite ? "active" : ""}`}
              onClick={handleFavorite}
              disabled={favoriteLoading}
            >
              {favoriteLoading ? (
                "⏳ Đang xử lý..."
              ) : isFavorite ? (
                <>❤️ Đã thêm vào yêu thích</>
              ) : (
                <>🤍 Thêm vào yêu thích</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal Thông Báo Premium Căn Giữa Màn Hình */}
      {showPremiumModal && (
        <div
          className="premium-modal-overlay"
          onClick={() => setShowPremiumModal(false)}
        >
          <div
            className="premium-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-icon"></div>
            <h2>Nội Dung Premium</h2>
            <p>
              Phim này thuộc gói <strong>Premium</strong>! Vui lòng nâng cấp tài
              khoản để trải nghiệm chất lượng phim cao nhất.
            </p>
            <div className="modal-actions">
              <button
                className="btn-modal-close"
                onClick={() => setShowPremiumModal(false)}
              >
                Đóng
              </button>
              <button
                className="btn-modal-upgrade"
                onClick={() => {
                  setShowPremiumModal(false);
                  navigate("/premium");
                }}
              >
                🚀 Nâng cấp ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MovieDetail;
