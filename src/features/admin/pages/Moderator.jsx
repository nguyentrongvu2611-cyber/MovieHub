import { useState, useEffect, useCallback } from "react";
import api from "../../../services/api";
import "./Moderator.css";

function Moderator() {
  const [movies, setMovies] = useState([]);
  const [homeBanner, setHomeBanner] = useState("");
  const [movieTitle, setMovieTitle] = useState("");

  // 1. Định nghĩa hàm fetchMovies chuẩn (chỉ dùng /movies)
  const fetchMovies = useCallback(async () => {
    try {
      // baseURL đã có /api/v1 nên chỉ cần gọi /movies
      const response = await api.get("/movies");
      console.log("Dữ liệu phim từ Backend:", response.data);

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.movies || response.data?.data || [];
        
      setMovies(data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách phim:", error);
    }
  }, []);

  // 2. Tải danh sách phim khi component mount
  useEffect(() => {
    let isMounted = true;

    const getMovies = async () => {
      try {
        const res = await api.get("/api/movies");
        if (isMounted) {
          const data = Array.isArray(res.data)
            ? res.data
            : res.data?.movies || [];
          setMovies(data);
        }
      } catch (err) {
        console.error("Lỗi tải danh sách phim:", err);
      }
    };

    getMovies();

    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Thêm phim mới
  const handleAddMovie = async (e) => {
    e.preventDefault();
    if (!movieTitle.trim()) return alert("Vui lòng nhập tên phim");

    try {
      await api.post("/movies", {
        title: movieTitle,
      });
      alert("Thêm phim thành công!");
      setMovieTitle("");
      fetchMovies(); // Tải lại danh sách sau khi thêm
    } catch (err) {
      console.error("Lỗi khi thêm phim:", err);
      alert(err?.response?.data?.detail || "Lỗi khi thêm phim mới");
    }
  };

  // 4. Cập nhật Banner Trang chủ
  const handleUpdateBanner = async () => {
    if (!homeBanner.trim()) return alert("Vui lòng nhập URL Banner");

    try {
      await api.put("/admin/homepage-banner", {
        banner_url: homeBanner,
      });
      alert("Cập nhật banner trang chủ thành công!");
    } catch (err) {
      console.error("Lỗi khi cập nhật banner:", err);
      alert(err?.response?.data?.detail || "Lỗi khi cập nhật trang chủ");
    }
  };

  return (
    <div className="moderator-page">
      <h1>🛡️ Bảng Quản Lý Dành Cho Moderator</h1>

      {/* CHỈNH SỬA TRANG CHỦ */}
      <div className="mod-section">
        <h2>🏠 Chỉnh Sửa Trang Chủ</h2>
        <div className="form-group">
          <label>URL Banner Trang Chủ:</label>
          <input
            type="text"
            placeholder="Nhập đường dẫn hình ảnh Banner..."
            value={homeBanner}
            onChange={(e) => setHomeBanner(e.target.value)}
          />
          <button onClick={handleUpdateBanner}>Cập nhật Trang Chủ</button>
        </div>
      </div>

      {/* QUẢN LÝ PHIM */}
      <div className="mod-section">
        <h2>🎬 Quản Lý Phim</h2>
        <form onSubmit={handleAddMovie} className="add-movie-form">
          <input
            type="text"
            placeholder="Tên phim mới..."
            value={movieTitle}
            onChange={(e) => setMovieTitle(e.target.value)}
          />
          <button type="submit">+ Thêm Phim</button>
        </form>

        <table className="mod-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên Phim</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {movies.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ textAlign: "center" }}>
                  Chưa có phim nào
                </td>
              </tr>
            ) : (
              movies.map((movie) => (
                <tr key={movie.id}>
                  <td>#{movie.id}</td>
                  <td>{movie.title}</td>
                  <td>
                    <button className="btn-edit">✏️ Sửa</button>
                    <button className="btn-delete">🗑️ Xóa</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Moderator;