import { createSlice } from "@reduxjs/toolkit";

const savedContinueWatching = localStorage.getItem(
  "continueWatching"
);

const initialState = {
  movies: savedContinueWatching
    ? JSON.parse(savedContinueWatching)
    : [],
};

const continueWatchingSlice = createSlice({
  name: "continueWatching",

  initialState,

  reducers: {
    updateWatchingProgress: (state, action) => {
      const {
        movie,
        currentTime,
        duration,
      } = action.payload;

      const existingMovie = state.movies.find(
        (item) => item.movie.id === movie.id
      );

      if (existingMovie) {
        existingMovie.currentTime = currentTime;
        existingMovie.duration = duration;
        existingMovie.updatedAt = Date.now();
      } else {
        state.movies.unshift({
          movie,
          currentTime,
          duration,
          updatedAt: Date.now(),
        });
      }

      state.movies.sort(
        (a, b) => b.updatedAt - a.updatedAt
      );

      localStorage.setItem(
        "continueWatching",
        JSON.stringify(state.movies)
      );
    },

    removeFromContinueWatching: (state, action) => {
      state.movies = state.movies.filter(
        (item) =>
          item.movie.id !== action.payload
      );

      localStorage.setItem(
        "continueWatching",
        JSON.stringify(state.movies)
      );
    },
  },
});

export const {
  updateWatchingProgress,
  removeFromContinueWatching,
} = continueWatchingSlice.actions;

export default continueWatchingSlice.reducer;