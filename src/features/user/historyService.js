import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

export const getUserHistory = async (userId) => {
  const response = await axios.get(
    `${API_URL}/history/user/${userId}`
  );

  return response.data;
};