import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import "./ContinueWatching.css";

function ContinueWatching() {
  const navigate = useNavigate();

  const movies = useSelector(
    (state) =>
      state.continueWatching.movies
  );

  if (movies.length === 0) {
    return null;
  }

  return (
    <section className="continue-watching">
      <h2>Tiếp tục xem</h2>

      <div className="continue-list">

        {movies.map((item) => {
          const progress =
            item.duration > 0
              ? (item.currentTime / item.duration) * 100
              : 0;

          return (
            <div
              className="continue-card"
              key={item.movie.id}
              onClick={() =>
                navigate(
                  `/watch/${item.movie.id}`
                )
              }
            >
              <img
                src={item.movie.image}
                alt={item.movie.title}
              />

              <div className="continue-overlay">
                ▶
              </div>

              <div className="progress-bar">
                <div
                  className="progress"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>

              <h3>
                {item.movie.title}
              </h3>

            </div>
          );
        })}

      </div>
    </section>
  );
}

export default ContinueWatching;