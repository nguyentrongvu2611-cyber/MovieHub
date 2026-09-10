import axios from "axios";

const API_URL = "https://moviehub-backend-ln1c.onrender.com/api";

export const getUserHistory = async (userId) => {
  const response = await axios.get(`${API_URL}/history/user/${userId}`);

  return response.data;
};
