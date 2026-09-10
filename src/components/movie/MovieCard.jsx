import { Link } from "react-router-dom";
import "./MovieCard.css";

const BASE_URL = "https://moviehub-backend-ln1c.onrender.com";

function MovieCard({ movie }) {
  if (!movie) return null;

  const rawPoster = movie.poster_url || movie.poster;
  const posterSrc = rawPoster?.startsWith("http")
    ? rawPoster
    : `${BASE_URL}${rawPoster?.startsWith("/") ? "" : "/"}${rawPoster || ""}`;

  const title = movie.title || movie.name || "Phim chưa có tên";
  const year = movie.year || "2024";
  const duration = movie.duration ? `${movie.duration} phút` : "90 phút";

  return (
    <Link to={`/movie/${movie.id}`} className="movie-card-link">
      {/* ẢNH POSTER */}
      <img
        alt={title}
        src={posterSrc}
        className="poster-img"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "https://placehold.co/300x450?text=No+Poster";
        }}
      />

      {/* OVERLAY & NÚT PLAY VÀNG (CHỈ HIỆN KHI HOVER) */}
      <div className="play-hover-overlay">
        <div className="play-button-icon">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="#ffffff">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>

      {/* THÔNG TIN PHIM DƯỚI CHÂN ANH */}
      <div className="card-info-overlay">
        <h3 className="card-title" title={title}>
          {title}
        </h3>
        <p className="card-subtext">
          {year} | {duration}
        </p>
      </div>
    </Link>
  );
}

export default MovieCard;
