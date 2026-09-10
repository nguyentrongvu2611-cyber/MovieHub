import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import MovieCard from "./MovieCard";
import "./MoviesPage.css";

const BASE_URL = "https://moviehub-backend-ln1c.onrender.com";

const CATEGORY_MAP = {
  "hanh-dong": 1,
  "kinh-di": 2,
  "vien-tuong": 3,
  "tinh-cam": 4,
  "co-trang": 5,
};

function MoviesPage() {
  const [searchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);

  const type = searchParams.get("type");
  const categorySlug = searchParams.get("category");
  const country = searchParams.get("country");
  const year = searchParams.get("year");
  const searchQuery = searchParams.get("q");

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);

      try {
        const response = await fetch(`${BASE_URL}/api/movies/`);
        if (!response.ok) throw new Error("Không thể tải dữ liệu phim");

        const data = await response.json();

        const filteredMovies = data.filter((movie) => {
          if (type) {
            if (type === "single" && movie.type && movie.type !== "single")
              return false;
            if (type === "series" && movie.type && movie.type !== "series")
              return false;
          }

          if (categorySlug) {
            const targetCategoryId = CATEGORY_MAP[categorySlug];
            if (targetCategoryId && movie.category_id !== targetCategoryId)
              return false;
          }

          if (country && movie.country && movie.country !== country)
            return false;
          if (year && movie.year !== Number(year)) return false;
          if (
            searchQuery &&
            !movie.title.toLowerCase().includes(searchQuery.toLowerCase())
          )
            return false;

          return true;
        });

        setMovies(filteredMovies);
      } catch (error) {
        console.error("Lỗi kết nối API Movies:", error);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [type, categorySlug, country, year, searchQuery]);

  const getPageTitle = () => {
    if (type) return `Phim ${type === "single" ? "Lẻ" : "Bộ"}`;
    if (categorySlug)
      return `Thể loại: ${categorySlug.replace(/-/g, " ").toUpperCase()}`;
    if (country) return `Quốc gia: ${country.replace(/-/g, " ").toUpperCase()}`;
    if (year) return `Năm phát hành: ${year}`;
    if (searchQuery) return `Kết quả tìm kiếm: "${searchQuery}"`;
    return "Tất cả phim";
  };

  return (
    <div className="movies-page">
      <h2 className="page-title">
        🔥 {getPageTitle()} ({movies.length} phim)
      </h2>

      {loading ? (
        <div className="loading">Đang tải danh sách phim...</div>
      ) : (
        <>
          <div className="movies-grid">
            {movies.length > 0 ? (
              movies.map((movie) => <MovieCard key={movie.id} movie={movie} />)
            ) : (
              <div className="no-movies">
                Không tìm thấy phim nào phù hợp với bộ lọc hiện tại.
              </div>
            )}
          </div>

          {movies.length > 0 && (
            <div className="pagination">
              <button className="page-btn">&lt;</button>
              <button className="page-btn active">1</button>
              <button className="page-btn">2</button>
              <button className="page-btn">3</button>
              <span className="page-dots">...</span>
              <button className="page-btn">&gt;</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default MoviesPage;
