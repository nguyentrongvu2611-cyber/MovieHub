import api from "../../services/api";

export const getMovies = async () => {
  const response = await api.get("/movies/");
  return response.data;
};

export const getMovieById = async (id) => {
  const response = await api.get(`/movies/${id}`);
  return response.data;
};

export const searchMovies = async (keyword) => {
  const response = await api.get("/movies/");

  const movies = response.data;

  const searchText = keyword.toLowerCase().trim();

  return movies.filter((movie) =>
    movie.title?.toLowerCase().includes(searchText),
  );
};

export const createMovie = async (movieData) => {
  const response = await api.post("/movies/", movieData);

  return response.data;
};

export const updateMovie = async (id, movieData) => {
  const response = await api.put(`/movies/${id}`, movieData);

  return response.data;
};

export const deleteMovie = async (id) => {
  const response = await api.delete(`/movies/${id}`);

  return response.data;
};
