import { useCallback, useEffect, useState } from "react";
import api from "../../../services/api";
import MovieModalForm from "../components/MovieModalForm";
import "./MovieManagement.css";
import { toast } from "react-toastify";

// Tự động lấy Backend Base URL từ cấu hình axios instance
const BACKEND_BASE_URL = (
  api.defaults.baseURL || "https://moviehub-backend-ln1c.onrender.com"
).replace(/\/api\/v1\/?$/, "");

// Ánh xạ slug/mã quốc gia sang tên tiếng Việt
const COUNTRY_MAP = {
  "han-quoc": "Hàn Quốc",
  hanquoc: "Hàn Quốc",
  kr: "Hàn Quốc",
  korea: "Hàn Quốc",
  "trung-quoc": "Trung Quốc",
  trungquoc: "Trung Quốc",
  cn: "Trung Quốc",
  china: "Trung Quốc",
  my: "Mỹ",
  us: "Mỹ",
  usa: "Mỹ",
  "au-my": "Âu Mỹ",
  "nhat-ban": "Nhật Bản",
  jp: "Nhật Bản",
  japan: "Nhật Bản",
  "thai-lan": "Thái Lan",
  thailand: "Thái Lan",
  "viet-nam": "Việt Nam",
  vn: "Việt Nam",
  vietnam: "Việt Nam",
};

const formatCountry = (country) => {
  if (!country) return "—";
  const cleanKey = String(country).trim().toLowerCase();
  return COUNTRY_MAP[cleanKey] || country;
};

const getFullImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${BACKEND_BASE_URL}${cleanPath}`;
};

export default function MovieManagement() {
  const [movies, setMovies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("all");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);

  // 1. Tải danh sách phim
  const loadMovies = useCallback(async () => {
    try {
      const response = await api.get("/movies");
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.movies || [];
      setMovies(data);
    } catch (error) {
      console.error("Lỗi tải phim:", error);
      toast.error("Không thể tải danh sách phim!");
      throw error;
    }
  }, []);

  // 2. Tải danh sách thể loại
  const loadCategories = useCallback(async () => {
    try {
      const response = await api.get("/categories");
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.categories || [];
      setCategories(data);
    } catch (error) {
      console.error("Lỗi tải thể loại:", error);
      toast.error("Không thể tải danh mục thể loại!");
      throw error;
    }
  }, []);

  const handleReload = async () => {
    try {
      setActionLoading(true);
      await Promise.all([loadMovies(), loadCategories()]);
      toast.info("Đã làm mới dữ liệu!");
    } catch (error) {
      console.error("Lỗi khi làm mới dữ liệu:", error);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        await Promise.all([loadMovies(), loadCategories()]);
      } catch (error) {
        console.error("Lỗi tải dữ liệu ban đầu:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, [loadMovies, loadCategories]);

  const openAddModal = () => {
    setEditingMovie(null);
    setShowModal(true);
  };

  const openEditModal = (movie) => {
    setEditingMovie(movie);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMovie(null);
  };

const handleFormSubmit = async (payload) => {
    try {
      setActionLoading(true);

      // Chuyển đổi video_urls từ String sang Dictionary Object nếu cần
      let formattedVideoUrls = payload.video_urls;
      if (typeof formattedVideoUrls === "string") {
        try {
          formattedVideoUrls = JSON.parse(formattedVideoUrls || "{}");
        } catch {
          formattedVideoUrls = {};
        }
      }

      const finalPayload = {
        ...payload,
        video_urls: formattedVideoUrls || {},
      };

      if (editingMovie) {
        await api.put(`/movies/${editingMovie.id}`, finalPayload);
      } else {
        await api.post("/movies", finalPayload);
      }

      closeModal();
      await Promise.all([loadMovies(), loadCategories()]);

      toast.success(
        editingMovie
          ? "🎉 Đã cập nhật phim thành công!"
          : "🎉 Đã thêm phim mới thành công!",
      );
    } catch (error) {
      console.error("Lỗi lưu phim:", error);

      const responseData = error?.response?.data;
      if (responseData?.detail && Array.isArray(responseData.detail)) {
        const errorMessages = responseData.detail
          .map(
            (err) => `${err.loc?.[err.loc.length - 1] || "Trường"}: ${err.msg}`,
          )
          .join(" | ");
        toast.error(`Lỗi dữ liệu nhập vào: ${errorMessages}`);
      } else {
        toast.error(responseData?.detail || "Không thể lưu thông tin phim!");
      }
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Xóa phim
  const handleDelete = async (movie) => {
    if (
      !window.confirm(
        `Bạn có chắc muốn xóa phim "${movie.title}"?\nThao tác này không thể khôi phục!`,
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);
      await api.delete(`/movies/${movie.id}`);
      toast.success(`🗑️ Đã xóa phim "${movie.title}" thành công!`);
      await Promise.all([loadMovies(), loadCategories()]);
    } catch (error) {
      console.error("Lỗi xóa phim:", error);
      toast.error(error?.response?.data?.detail || "Không thể xóa phim!");
    } finally {
      setActionLoading(false);
    }
  };

  const getCategoryName = (movie) => {
    if (movie.category?.name) return movie.category.name;
    if (typeof movie.category === "string" && movie.category)
      return movie.category;
    if (movie.category_name) return movie.category_name;

    const catId = movie.category_id || movie.category;
    if (catId) {
      const foundCategory = categories.find(
        (c) => String(c.id) === String(catId),
      );
      if (foundCategory) return foundCategory.name;
    }
    return "Chưa phân loại";
  };

  // Lọc danh sách phim theo từ khóa và loại (Free/Premium)
  const filteredMovies = movies.filter((movie) => {
    const keyword = search.toLowerCase().trim();
    const matchSearch =
      !keyword ||
      movie.title?.toLowerCase().includes(keyword) ||
      movie.director?.toLowerCase().includes(keyword) ||
      movie.description?.toLowerCase().includes(keyword) ||
      String(movie.id).includes(keyword);

    if (!matchSearch) return false;
    if (selectedType === "premium") return !movie.is_free;
    if (selectedType === "free") return movie.is_free;
    return true;
  });

  const premiumCount = movies.filter((m) => !m.is_free).length;
  const freeCount = movies.filter((m) => m.is_free).length;

  if (loading) {
    return (
      <div className="movie-management-page">
        <div className="movie-loading">🎬 Đang tải danh sách phim...</div>
      </div>
    );
  }

  return (
    <div className="movie-management-page">
      {/* Header */}
      <div className="movie-management-header">
        <div className="movie-title">
          <div className="movie-title-icon">🎬</div>
          <div>
            <h1>Quản lý phim</h1>
            <p>Thêm, chỉnh sửa và quản lý kho phim MovieHub</p>
          </div>
        </div>

        <div className="movie-header-actions">
          <button
            className="reload-movie-btn"
            onClick={handleReload}
            disabled={actionLoading}
          >
            {actionLoading ? "↻ Đang tải..." : "↻ Làm mới"}
          </button>
          <button
            className="add-movie-btn"
            onClick={openAddModal}
            disabled={actionLoading}
          >
            + Thêm phim
          </button>
        </div>
      </div>

      {/* Thống kê / Filter Cards */}
      <div className="movie-stats">
        <div
          className={`movie-stat-card ${selectedType === "all" ? "selected" : ""}`}
          onClick={() => setSelectedType("all")}
        >
          <div className="movie-stat-icon-wrapper total-icon">
            <img
              src="https://cdn-icons-png.flaticon.com/512/3172/3172554.png"
              alt="Tổng số phim"
              className="stat-card-img"
            />
          </div>
          <div className="stat-info">
            <span>Tổng số phim</span>
            <h2>{movies.length}</h2>
          </div>
        </div>

        <div
          className={`movie-stat-card premium-stat ${selectedType === "premium" ? "selected" : ""}`}
          onClick={() => setSelectedType("premium")}
        >
          <div className="movie-stat-icon-wrapper premium-icon">
            <img
              src="https://cdn-icons-png.flaticon.com/512/2583/2583344.png"
              alt="Phim Premium"
              className="stat-card-img"
            />
          </div>
          <div className="stat-info">
            <span>Phim Premium</span>
            <h2>{premiumCount}</h2>
          </div>
        </div>

        <div
          className={`movie-stat-card free-stat ${selectedType === "free" ? "selected" : ""}`}
          onClick={() => setSelectedType("free")}
        >
          <div className="movie-stat-icon-wrapper free-icon">
            <img
              src="https://cdn-icons-png.flaticon.com/512/4221/4221419.png"
              alt="Phim Free"
              className="stat-card-img"
            />
          </div>
          <div className="stat-info">
            <span>Phim Miễn Phí</span>
            <h2>{freeCount}</h2>
          </div>
        </div>
      </div>

      {/* Toolbar Tìm kiếm */}
      <div className="movie-toolbar">
        <div className="movie-search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên phim, đạo diễn, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="movie-count">
          Hiển thị: <strong>{filteredMovies.length}</strong> / {movies.length}{" "}
          phim
        </span>
      </div>

      {/* Bảng Danh Sách Phim */}
      <div className="movie-table-container">
        <table className="movie-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Poster</th>
              <th>Tên phim</th>
              <th>Thể loại</th>
              <th>Quốc gia</th>
              <th>Năm</th>
              <th>Gói</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredMovies.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-movies">
                  Không tìm thấy phim nào khớp với điều kiện lọc.
                </td>
              </tr>
            ) : (
              filteredMovies.map((movie) => (
                <tr key={movie.id}>
                  <td className="movie-id">#{movie.id}</td>
                  <td>
                    {movie.poster_url ? (
                      <img
                        src={getFullImageUrl(movie.poster_url)}
                        alt={movie.title}
                        className="movie-poster"
                      />
                    ) : (
                      <div className="no-poster">N/A</div>
                    )}
                  </td>
                  <td>
                    <div className="movie-name">
                      <strong>{movie.title}</strong>
                      {movie.director && (
                        <small>Đạo diễn: {movie.director}</small>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="category-badge">
                      {getCategoryName(movie)}
                    </span>
                  </td>
                  <td>{formatCountry(movie.country || movie.country_name)}</td>
                  <td>{movie.year || movie.release_year || "—"}</td>
                  <td>
                    <span
                      className={`type-badge ${movie.is_free ? "free" : "premium"}`}
                    >
                      {movie.is_free ? "Free" : "Premium"}
                    </span>
                  </td>
                  <td>
                    <div className="movie-actions">
                      <button
                        className="movie-btn edit"
                        onClick={() => openEditModal(movie)}
                        disabled={actionLoading}
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        className="movie-btn delete"
                        onClick={() => handleDelete(movie)}
                        disabled={actionLoading}
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form Thêm/Sửa */}
      <MovieModalForm
        key={editingMovie ? editingMovie.id : "new-movie"}
        isOpen={showModal}
        onClose={closeModal}
        onSubmit={handleFormSubmit}
        editingMovie={editingMovie}
        categories={categories}
      />
    </div>
  );
}
