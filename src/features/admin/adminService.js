// Import shared api instance (lùi 3 cấp: pages -> admin -> features -> src)
import api from "../../services/api";

export const getUsers = async () => {
  const response = await api.get("/admin/users");
  return response.data;
};

export const toggleBanUser = async (userId) => {
  const response = await api.put(`/admin/users/${userId}/ban`);
  return response.data;
};

export const softDeleteUser = async (userId) => {
  const response = await api.put(`/admin/users/${userId}/soft-delete`);
  return response.data;
};

export const hardDeleteUser = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};

export const updateUserRole = async (userId, role) => {
  const response = await api.put(`/admin/users/${userId}/role`, null, {
    params: { role },
  });
  return response.data;
};

export const updatePremium = async (userId, days = 30, lifetime = false) => {
  const response = await api.put(`/admin/users/${userId}/premium`, null, {
    params: { days, lifetime },
  });
  return response.data;
};

export const removePremium = async (userId) => {
  const response = await api.put(`/admin/users/${userId}/remove-premium`);
  return response.data;
};

export const toggleMuteUser = async (userId) => {
  const response = await api.put(`/admin/users/${userId}/mute`);
  return response.data;
};

export const deleteWatchlist = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}/watchlist`);
  return response.data;
};

export const deleteHistory = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}/history`);
  return response.data;
};

export const getUserHistory = async (userId) => {
  const response = await api.get(`/admin/users/${userId}/history`);
  return response.data;
};

export const updateStreaming = async (userId, data) => {
  const response = await api.put(`/admin/users/${userId}/streaming`, null, {
    params: data,
  });
  return response.data;
};