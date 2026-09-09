import api from "../../services/api";

export const getWatchlist = async (userId) => {
  const response = await api.get(
    `/watchlist/${userId}`
  );

  return response.data;
};

export const addToWatchlist = async (
  userId,
  movieId
) => {
  const response = await api.post(
    "/watchlist/",
    null,
    {
      params: {
        user_id: userId,
        movie_id: movieId
      }
    }
  );

  return response.data;
};

export const removeFromWatchlist = async (
  userId,
  movieId
) => {
  const response = await api.delete(
    `/watchlist/${userId}/${movieId}`
  );

  return response.data;
};