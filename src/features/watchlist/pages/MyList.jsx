import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getWatchlist } from "../watchlistService";

import { getMovieById } from "../../movies/movieService";

import "./MyList.css";

const API_BASE_URL = "https://moviehub-backend-ln1c.onrender.com";

function MyList() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [user] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const getPosterUrl = (url) => {
    if (!url) return "https://placehold.co/300x450?text=No+Poster";
    if (url.startsWith("http")) return url;

    const cleanPath = url.replace(/\\/g, "/");
    const formattedPath = cleanPath.startsWith("/")
      ? cleanPath
      : `/${cleanPath}`;

    return `${API_BASE_URL}${formattedPath}`;
  };

  useEffect(() => {
    async function loadWatchlist() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const watchlist = await getWatchlist(user.id);

        const movieList = await Promise.all(
          watchlist.map((item) => getMovieById(item.movie_id || item.id)),
        );

        setMovies(movieList.filter(Boolean));
      } catch (error) {
        console.error("Lỗi tải danh sách phim:", error);
      } finally {
        setLoading(false);
      }
    }

    loadWatchlist();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="my-list-page">
        <div className="my-list-container">
          <h2 style={{ textAlign: "center", padding: "60px 0", color: "#fff" }}>
            Đang tải danh sách...
          </h2>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="my-list-page">
        <div
          className="my-list-container"
          style={{ textAlign: "center", paddingTop: "60px" }}
        >
          <h2 style={{ color: "#fff" }}>Bạn chưa đăng nhập</h2>
          <Link to="/login" className="browse-movies-btn">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="my-list-page">
      <div className="my-list-container">
        <h1>❤️ Danh sách yêu thích</h1>

        {movies.length > 0 ? (
          <div className="movie-grid">
            {movies.map((movie) => {
              const posterSrc =
                movie.poster_url ||
                movie.poster ||
                movie.poster_path ||
                movie.thumbnail;

              return (
                <Link
                  key={movie.id}
                  to={`/movie/${movie.id}`}
                  className="movie-card"
                >
                  {movie.is_premium && (
                    <span className="movie-badge">PREMIUM</span>
                  )}

                  <img
                    className="poster-img"
                    src={getPosterUrl(posterSrc)}
                    alt={movie.title}
                    onError={(e) => {
                      e.target.src =
                        "https://placehold.co/300x450?text=No+Poster";
                    }}
                  />

                  <div className="play-btn-overlay">
                    <div className="play-icon-circle">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M8 5V19L19 12L8 5Z" fill="#ffffff" />
                      </svg>
                    </div>
                  </div>

                  <div className="movie-card-info">
                    <h3 title={movie.title}>{movie.title}</h3>
                    <p>
                      {movie.year}{" "}
                      {movie.duration ? `| ${movie.duration} phút` : ""}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="empty-watchlist">
            <h2>Chưa có phim yêu thích</h2>
            <p>Hãy thêm những bộ phim bạn thích vào danh sách.</p>
            <Link to="/movies" className="browse-movies-btn">
              Khám phá phim
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyList;
