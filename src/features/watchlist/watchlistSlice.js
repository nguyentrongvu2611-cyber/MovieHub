import { createSlice } from "@reduxjs/toolkit";

const savedWatchlist = localStorage.getItem("watchlist");

const initialState = {
  movies: savedWatchlist
    ? JSON.parse(savedWatchlist)
    : [],
};

const watchlistSlice = createSlice({
  name: "watchlist",

  initialState,

  reducers: {
    addToWatchlist: (state, action) => {
      const exists = state.movies.find(
        (movie) => movie.id === action.payload.id
      );

      if (!exists) {
        state.movies.push(action.payload);

        localStorage.setItem(
          "watchlist",
          JSON.stringify(state.movies)
        );
      }
    },

    removeFromWatchlist: (state, action) => {
      state.movies = state.movies.filter(
        (movie) => movie.id !== action.payload
      );

      localStorage.setItem(
        "watchlist",
        JSON.stringify(state.movies)
      );
    },
  },
});

export const {
  addToWatchlist,
  removeFromWatchlist,
} = watchlistSlice.actions;

export default watchlistSlice.reducer;