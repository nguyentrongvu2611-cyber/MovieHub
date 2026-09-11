import { useNavigate } from "react-router-dom";
import "./banner.css";

function Banner({ movie, bannerUrl, user }) {
  const navigate = useNavigate();

  if (!movie && !bannerUrl) return null;

  // Ưu tiên lấy link từ prop bannerUrl truyền vào, nếu không có thì lấy từ object movie
  const heroBg = bannerUrl || movie?.backdrop_url || movie?.poster_url;

  const handlePlayMovie = () => {
    if (!movie) return;
    if (movie.is_premium && !user?.is_premium) {
      alert("Phim này dành riêng cho tài khoản Premium. Vui lòng nâng cấp gói để xem!");
      navigate("/premium");
      return;
    }

    navigate(`/watch/${movie.id || movie._id}`);
  };

  const handleMovieDetail = () => {
    if (!movie) return;
    navigate(`/movie/${movie.id || movie._id}`);
  };

  return (
    <section
      className="hero"
      style={{
        backgroundImage: heroBg ? `url("${heroBg}")` : "none",
      }}
    >
      <div className="hero-overlay" />
      <div className="hero-content">
        <div className="hero-badge">NỔI BẬT</div>
        <h1 className="hero-title">{movie?.title || "MOVIEHUB"}</h1>
        <p className="hero-description">
          {movie?.description
            ? movie.description.length > 140
              ? `${movie.description.substring(0, 140)}...`
              : movie.description
            : "Xem những bộ phim nổi bật, phim chiếu rạp, phim lẻ mới nhất và anime hấp dẫn."}
        </p>

        <div className="hero-buttons">
          <button className="play-btn" onClick={handlePlayMovie}>
            <span className="btn-icon">▶</span> Xem ngay
          </button>
          <button className="info-btn" onClick={handleMovieDetail}>
            <span className="btn-icon">ℹ</span> Chi tiết
          </button>
        </div>
      </div>
    </section>
  );
}

export default Banner;