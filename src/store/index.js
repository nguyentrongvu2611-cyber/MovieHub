import { configureStore } from "@reduxjs/toolkit";

import authReducer from "../features/auth/authSlice";
import watchlistReducer from "../features/watchlist/watchlistSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    watchlist: watchlistReducer,
  },
});

export default store;