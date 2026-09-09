import { useEffect, useState } from "react";
import {
  useSearchParams,
  Link
} from "react-router-dom";

import {
  searchMovies
} from "../../services/movieService";

import "./Search.css";

function Search() {
  const [searchParams] = useSearchParams();

  const [movies, setMovies] = useState([]);

  const keyword =
    searchParams.get("q") || "";

  useEffect(() => {

    const search = async () => {

      try {

        const data =
          await searchMovies(keyword);

        setMovies(data);

      } catch (error) {

        console.error(
          "Lỗi tìm kiếm:",
          error
        );

      }
    };

    search();

  }, [keyword]);

  return (
    <div className="search-page">

      <h1>
        Kết quả tìm kiếm
      </h1>

      <p>
        Từ khóa: <strong>{keyword}</strong>
      </p>

      {movies.length > 0 ? (

        <div className="movie-grid">

          {movies.map((movie) => (

            <Link
              key={movie.id}
              to={`/movie/${movie.id}`}
              className="movie-card"
            >

              <img
                src={
                  movie.poster_url ||
                  "https://placehold.co/300x450?text=Movie"
                }
                alt={movie.title}
              />

              <h3>
                {movie.title}
              </h3>

              <p>
                {movie.year}
              </p>

            </Link>

          ))}

        </div>

      ) : (

        <p>
          Không tìm thấy phim phù hợp.
        </p>

      )}

    </div>
  );
}

export default Search;