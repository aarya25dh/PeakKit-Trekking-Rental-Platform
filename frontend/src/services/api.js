import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000/api/";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach JWT token from localStorage to all outgoing requests
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("jwt") ||
      localStorage.getItem("peakkit_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified error extraction
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token may have expired
      console.warn("API request unauthorized (401).");
    }
    return Promise.reject(error);
  }
);

// Orders endpoints
export const ordersAPI = {
  getAll: () => api.get("orders/"),
  getById: (orderId) => api.get(`orders/${orderId}/`),
  create: (orderData) => api.post("orders/create/", orderData),
  updateStatus: (orderId, orderStatus) =>
    api.patch(`orders/${orderId}/status/`, { order_status: orderStatus }),
  getTracking: (orderId) => api.get(`orders/${orderId}/tracking/`),
  returnOrder: (orderId, condition = "good") =>
    api.patch(`orders/${orderId}/return/`, { condition }),
};

// Cart endpoints
export const cartAPI = {
  updateItem: (itemId, data) => api.patch(`cart/${itemId}/`, data),
};

// Gear availability endpoints
export const gearAPI = {
  getAvailability: (gearId) => api.get(`gear/${gearId}/availability/`),
};

// Notifications endpoints
export const notificationsAPI = {
  getAll: () => api.get("notifications/"),
  getUnreadCount: () => api.get("notifications/unread-count/"),
  markRead: (id) => api.patch(`notifications/${id}/read/`),
  markAllRead: () => api.patch("notifications/read-all/"),
  delete: (id) => api.delete(`notifications/${id}/`),
};

// Auth endpoints
export const authAPI = {
  login: (credentials) => api.post("auth/login/", credentials),
  register: (userData) => api.post("auth/register/", userData),
  logout: (refreshToken) =>
    api.post("auth/logout/", { refresh_token: refreshToken }),
  refreshToken: (refreshToken) =>
    api.post("auth/refresh/", { refresh: refreshToken }),
};

// Profile endpoints
export const profileAPI = {
  get: () => api.get("profile/"),
  update: (profileData) => api.patch("profile/", profileData),
};

export default api;
