import MovieCard from "./MovieCard";
import "./MovieRow.css";

function MovieRow({ title, movies = [] }) {
  if (!movies || movies.length === 0) return null;

  return (
    <div className="movie-row-container">
      <h2 className="movie-row-title">{title}</h2>

      <div className="movie-horizontal-list">
        {movies.map((movie) => (
          <MovieCard key={movie.id || movie._id} movie={movie} />
        ))}
      </div>
    </div>
  );
}

export default MovieRow;
