import api from "../../services/api";

export const createPayment = async (userId, plan) => {
  // Thêm dấu / ở cuối endpoint để khớp với FastAPI router
  const response = await api.post("/payments/", {
    user_id: Number(userId),
    plan: plan,
  });
  return response.data;
};

export const getPayments = async () => {
  const response = await api.get("/payments/");
  return response.data;
};

export const getUserPayments = async (userId) => {
  try {
    const response = await api.get(`/payments/user/${userId}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return [];
    }
    throw error;
  }
};

export const approvePayment = async (paymentId) => {
  const response = await api.put(`/payments/${paymentId}/approve`);
  return response.data;
};

export const checkPaymentStatus = async (userId) => {
  try {
    const response = await api.get(`/payments/check-status/${userId}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    throw error;
  }
};