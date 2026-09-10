import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import MovieRow from "../../../components/movie/MovieRow";
import "./Movies.css";

const API_BASE_URL = "https://moviehub-backend-ln1c.onrender.com";

const getPosterUrl = (url) => {
  if (!url) return "https://placehold.co/300x450?text=No+Poster";
  if (url.startsWith("http")) return url;

  const cleanPath = url.replace(/\\/g, "/");
  const formattedPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;

  return `${API_BASE_URL}${formattedPath}`;
};

const TOPIC_MAP = {
  cinema: ["chieu-rap", "feature", "cinema", "phim-chieu-rap"],
  dubbed: ["thuyet-minh", "dubbed"],
  voice: ["long-tieng", "voice"],
  trailer: ["trailer"],
  "hot-week": [
    "hot-weekly",
    "hot-week",
    "hot_weekly",
    "hot",
    "phim-hot",
    "thinh-hanh",
    "trending",
  ],
  completed: ["completed", "hoan-thanh"],
};

const GENRE_ID_MAP = {
  action: [1],
  "hanh-dong": [1],
  horror: [2],
  "kinh-di": [2],
  scifi: [3],
  "khoa-hoc-vien-tuong": [3],
  comedy: [4],
  "hai-huoc": [4],
  romance: [5],
  "tinh-cam": [5],
  historical: [6],
  "co-trang": [6],
  drama: [7],
  "tam-ly": [7],
  crime: [8],
  "hinh-su": [8],
  war: [9],
  "chien-tranh": [9],
  martial: [10],
  "vo-thuat": [10],
  anime: [11],
  animation: [11],
  "hoat-hinh": [11],
};

const COUNTRY_MAP = {
  vietnam: ["vn", "vietnam", "viet-nam", "việt nam"],
  "viet-nam": ["vn", "vietnam", "viet-nam", "việt nam"],
  vn: ["vn", "vietnam", "viet-nam", "việt nam"],
  "han-quoc": ["han-quoc", "kr", "korea", "hàn quốc"],
  korea: ["han-quoc", "kr", "korea", "hàn quốc"],
  "trung-quoc": ["trung-quoc", "cn", "china", "trung quốc"],
  china: ["trung-quoc", "cn", "china", "trung quốc"],
  "au-my": ["au-my", "us", "usa", "âu mỹ", "us-uk"],
  us: ["au-my", "us", "usa", "âu mỹ", "us-uk"],
  "nhat-ban": ["nhat-ban", "jp", "japan", "nhật bản"],
  japan: ["nhat-ban", "jp", "japan", "nhật bản"],
};

const Movies = () => {
  const [searchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const type = searchParams.get("type");
  const yearParam =
    searchParams.get("year") ||
    searchParams.get("release_year") ||
    searchParams.get("y");
  const topicParam =
    searchParams.get("topic") ||
    searchParams.get("section_type") ||
    searchParams.get("section");
  const genreParam =
    searchParams.get("genre") ||
    searchParams.get("category") ||
    searchParams.get("category_id");
  const countryParam = searchParams.get("country");

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        // SỬA LỖI 1: Cập nhật URL đúng prefix /api/v1/movies/
        const res = await fetch(`${API_BASE_URL}/api/v1/movies/`);
        const data = await res.json();
        const movieArray = Array.isArray(data) ? data : data?.movies || [];

        const formattedMovies = movieArray.map((m) => ({
          ...m,
          poster_url: getPosterUrl(m.poster_url || m.poster),
        }));

        setMovies(formattedMovies);
      } catch (err) {
        console.error("Lỗi lấy danh sách phim:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  const checkIsMoviePremium = (movie) => {
    if (movie.is_free !== undefined && movie.is_free !== null) {
      return (
        movie.is_free === false ||
        movie.is_free === "false" ||
        movie.is_free === 0
      );
    }
    if (movie.is_premium !== undefined && movie.is_premium !== null) {
      return (
        movie.is_premium === true ||
        movie.is_premium === "true" ||
        movie.is_premium === 1
      );
    }
    return movie.access_type === "premium";
  };

  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      // SỬA LỖI 2: Kiểm tra linh hoạt cả movie.movie_type lẫn movie.type
      if (type) {
        const actualType = String(
          movie.movie_type || movie.type || "",
        ).toLowerCase();
        const targetType = String(type).toLowerCase();
        if (actualType !== targetType) return false;
      }

      if (yearParam) {
        const targetYear = String(yearParam).trim();
        const movieYear = String(movie.year || movie.release_year || "").trim();
        if (movieYear !== targetYear) return false;
      }

      if (topicParam) {
        const key = topicParam.toLowerCase().trim();
        const movieSection = String(movie.section_type || movie.topic || "")
          .toLowerCase()
          .trim();
        const validSections = TOPIC_MAP[key] || [key];
        const isMatch = validSections.some(
          (sec) => movieSection.includes(sec) || sec.includes(movieSection),
        );
        if (!isMatch) return false;
      }

      if (genreParam) {
        const lowerGenre = genreParam.toLowerCase().trim();
        const movieCatId = Number(movie.category_id || movie.genre_id);

        if (!isNaN(lowerGenre) && lowerGenre !== "") {
          if (movieCatId !== Number(lowerGenre)) return false;
        } else {
          const targetIds = GENRE_ID_MAP[lowerGenre];
          if (targetIds && targetIds.length > 0) {
            if (!targetIds.includes(movieCatId)) return false;
          } else {
            return false;
          }
        }
      }

      // SỬA LỖI 3: Kiểm tra quốc gia linh hoạt hơn
      if (countryParam) {
        const paramCountry = countryParam.toLowerCase().trim();
        const movieCountry = String(movie.country || "")
          .toLowerCase()
          .trim();
        const validCountries = COUNTRY_MAP[paramCountry] || [paramCountry];

        const isMatchCountry = validCountries.some((c) =>
          movieCountry.includes(c),
        );
        if (!isMatchCountry) return false;
      }

      return true;
    });
  }, [movies, type, yearParam, topicParam, genreParam, countryParam]);

  const freeMovies = useMemo(
    () => filteredMovies.filter((m) => !checkIsMoviePremium(m)),
    [filteredMovies],
  );

  const premiumMovies = useMemo(
    () => filteredMovies.filter((m) => checkIsMoviePremium(m)),
    [filteredMovies],
  );

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "100px 0", color: "#fff" }}>
        Đang tải dữ liệu...
      </div>
    );

  return (
    <div className="movies-page">
      <div className="movies-container">
        <h1>
          {topicParam === "hot-week"
            ? "🔥 Phim Thịnh Hành Trong Tuần"
            : "Danh Sách Phim"}
          {yearParam ? ` - Năm ${yearParam}` : ""}
        </h1>

        {filteredMovies.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}
          >
            Không tìm thấy phim phù hợp với bộ lọc.
          </div>
        ) : (
          <>
            {freeMovies.length > 0 && (
              <MovieRow title="🎬 PHIM MIỄN PHÍ (FREE)" movies={freeMovies} />
            )}

            {premiumMovies.length > 0 && (
              <MovieRow
                title=" PHIM ĐỘC QUYỀN PREMIUM"
                movies={premiumMovies}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Movies;
