import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

import MovieRow from "../../../components/movie/MovieRow";
import { getMovies } from "../movieService";

const API_BASE_URL = "http://127.0.0.1:8000";

const getPosterUrl = (url) => {
  if (!url) return "https://placehold.co/300x450?text=No+Poster";
  if (url.startsWith("http")) return url;

  const cleanPath = url.replace(/\\/g, "/");
  const formattedPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;

  return `${API_BASE_URL}${formattedPath}`;
};

function Home() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // 1. LẤY THÔNG TIN USER TỪ LOCALSTORAGE
  const [user] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    const loadMovies = async () => {
      try {
        const data = await getMovies();
        const movieArray = Array.isArray(data) ? data : data?.movies || [];

        const formattedMovies = movieArray.map((m) => ({
          ...m,
          poster_url: getPosterUrl(m.poster_url || m.poster),
        }));

        setMovies(formattedMovies);
      } catch (err) {
        console.error("Lỗi tải phim:", err);
        setError("Không thể tải danh sách phim");
      } finally {
        setLoading(false);
      }
    };

    loadMovies();
  }, []);

  // 2. HÀM XỬ LÝ KHI BẤM NÚT XEM NGAY Ở HERO BANNER
  const handlePlayMovie = (movie) => {
    if (!movie) return;

    // Nếu phim là Premium mà người dùng chưa có tài khoản Premium
    if (movie.is_premium && !user?.is_premium) {
      alert(
        "Phim này dành riêng cho tài khoản Premium. Vui lòng nâng cấp gói để xem!",
      );
      navigate("/premium"); // Chuyển sang /premium
      return;
    }

    // Nếu là phim miễn phí hoặc user đã có Premium
    navigate(`/watch/${movie.id}`);
  };

  const filterBySection = (sectionKey, categoryKeywords = []) => {
    return movies.filter((movie) => {
      if (movie.section_type === sectionKey) return true;

      if (
        (!movie.section_type || movie.section_type === "none") &&
        movie.category
      ) {
        const catName = (
          movie.category.name ||
          movie.category ||
          ""
        ).toLowerCase();
        return categoryKeywords.some((keyword) => catName.includes(keyword));
      }
      return false;
    });
  };

  const trendingMovies = filterBySection("trending", ["thịnh hành", "hot"]);
  const cinemaMovies = filterBySection("cinema", ["chiếu rạp", "rạp"]);
  const singleMovies = filterBySection("single", ["phim lẻ", "lẻ"]);
  const animeMovies = filterBySection("anime", ["hoạt hình", "anime"]);

  const featuredMovie = trendingMovies[0] || movies[0];

  if (loading) {
    return (
      <div className="home-status-container">
        <div className="spinner"></div>
        <h2>Đang tải danh sách phim...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-status-container error">
        <h2>⚠️ {error}</h2>
      </div>
    );
  }

  return (
    <div className="home">
      {/* HERO BANNER */}
      <section
        className="hero"
        style={{
      //    backgroundImage: featuredMovie?.poster_url
       //     ? `linear-gradient(90deg, #141414 0%, rgba(67, 66, 66, 0.7) 45%, rgba(20,20,20,0.2) 100%), linear-gradient(to top, #141414 0%, transparent 50%), url("${featuredMovie.poster_url}")`
       //     : `linear-gradient(90deg, #141414 0%, rgba(20,20,20,0.7) 45%), url("https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80")`,
backgroundImage: `linear-gradient(90deg, #141414 0%, rgba(20,20,20,0.8) 40%, transparent 100%), 
                      linear-gradient(to top, #141414 0%, transparent 50%), 
                      url(http://127.0.0.1:8000/uploads/posters/9f5e2f3f-a138-443a-af09-97f4225d1df5.jpg)`,
        }}
      >
        <div className="hero-content">
          <h1>{featuredMovie?.title || "MOVIEHUB"}</h1>
          <p className="hero-description">
            {featuredMovie?.description
              ? featuredMovie.description.length > 180
                ? `${featuredMovie.description.substring(0, 180)}...`
                : featuredMovie.description
              : "Xem những bộ phim nổi bật, phim chiếu rạp, phim lẻ mới nhất và anime hấp dẫn."}
          </p>

          <div className="hero-buttons">
            {/* THAY ĐỔI SỰ KIỆN CLICK Ở ĐÂY */}
            <button
              className="play-btn"
              onClick={() => handlePlayMovie(featuredMovie)}
            >
              ▶ Xem ngay
            </button>
            <button
              className="info-btn"
              onClick={() =>
                featuredMovie && navigate(`/movie/${featuredMovie.id}`)
              }
            >
              ℹ Thông tin
            </button>
          </div>
        </div>
      </section>

      {/* DANH SÁCH HÀNG PHIM */}
      <div className="home-movies">
        {trendingMovies.length > 0 && (
          <MovieRow title="🔥 PHIM THỊNH HÀNH" movies={trendingMovies} />
        )}

        {cinemaMovies.length > 0 && (
          <MovieRow title="🎬 PHIM CHIẾU RẠP MỚI" movies={cinemaMovies} />
        )}

        {singleMovies.length > 0 && (
          <MovieRow title="📼 PHIM LẺ MỚI CẬP NHẬT" movies={singleMovies} />
        )}

        {animeMovies.length > 0 && (
          <MovieRow title="⛩️ PHIM HOẠT HÌNH & ANIME" movies={animeMovies} />
        )}

        {movies.length > 0 && (
          <MovieRow title="🌐 TẤT CẢ PHIM" movies={movies} />
        )}
      </div>
    </div>
  );
}

export default Home;
