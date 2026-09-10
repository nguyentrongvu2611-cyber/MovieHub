import axios from "axios";

const API_URL = "https://moviehub-backend-ln1c.onrender.com/api";

export const uploadPoster = async (file) => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await axios.post(`${API_URL}/upload/poster`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const uploadVideo = async (file) => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await axios.post(`${API_URL}/upload/video`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};
