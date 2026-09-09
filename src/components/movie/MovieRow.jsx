import MovieCard from "./MovieCard";

function MovieRow({ title, movies = [] }) {
  return (
    <div style={{ marginBottom: "32px", padding: "0 20px" }}>
      <h2 style={{ color: "#fff", fontSize: "18px", marginBottom: "14px" }}>
        🔥 {title}
      </h2>

      {/* Container xếp 8 phim 1 hàng */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(8, 1fr)", /* Chia đều 8 cột */
          gap: "12px",
          width: "100%",
        }}
      >
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
}

export default MovieRow;