import { useEffect, useState } from "react";
import "./Home.css";

import Banner from "../../../components/layout/banner";
import MovieRow from "../../../components/movie/MovieRow";
import { getMovies } from "../movieService";

const API_BASE_URL = "https://moviehub-backend-ln1c.onrender.com";

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
          backdrop_url: getPosterUrl(
            m.backdrop_url || m.backdrop || m.poster_url || m.poster,
          ),
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
      {/* BANNER NỔI BẬT */}
      <Banner
        bannerUrl={getPosterUrl(
          "uploads/posters/178a0901-a13b-4395-840b-cd6cdafe9dd5.jpg",
        )}
        movie={featuredMovie}
        user={user}
      />

      {/* DANH SÁCH HÀNG PHIM */}
      <div className="home-movies">
        {trendingMovies.length > 0 && (
          <MovieRow title="PHIM THỊNH HÀNH" movies={trendingMovies} />
        )}

        {cinemaMovies.length > 0 && (
          <MovieRow title="PHIM CHIẾU RẠP MỚI" movies={cinemaMovies} />
        )}

        {singleMovies.length > 0 && (
          <MovieRow title="PHIM LẺ MỚI CẬP NHẬT" movies={singleMovies} />
        )}

        {animeMovies.length > 0 && (
          <MovieRow title="PHIM HOẠT HÌNH & ANIME" movies={animeMovies} />
        )}

        {movies.length > 0 && <MovieRow title="TẤT CẢ PHIM" movies={movies} />}
      </div>
    </div>
  );
}

export default Home;
