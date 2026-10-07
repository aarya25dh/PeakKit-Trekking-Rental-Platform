import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "/api/";

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

// Public Gear Catalog & Availability endpoints
export const gearAPI = {
  getAll: (params = {}) => api.get("gear/", { params }),
  getById: (gearId) => api.get(`gear/${gearId}/`),
  getAvailability: (gearId) => api.get(`gear/${gearId}/availability/`),
};

// Adventure Kits endpoints
export const kitsAPI = {
  getAll: (params = {}) => api.get("kits/", { params }),
  getBySlug: (slug) => api.get(`kits/${slug}/`),
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

// Global Search endpoints
export const searchAPI = {
  search: (q) => api.get("search/", { params: { q } }),
};

// Admin Portal endpoints
export const adminAPI = {
  // Analytics
  getDashboard: () => api.get("admin/analytics/dashboard/"),
  getMonthlyRevenue: () => api.get("admin/analytics/revenue/monthly/"),
  getActiveRentals: () => api.get("admin/analytics/rentals/active/"),
  getInventoryUtilization: () => api.get("admin/analytics/inventory/utilization/"),
  getTopRentedGear: () => api.get("admin/analytics/gear/top-rented/"),
  getPendingReturns: () => api.get("admin/analytics/returns/pending/"),

  // Gear Inventory CRUD
  getGear: () => api.get("admin/gear/"),
  createGear: (data) => api.post("admin/gear/", data),
  updateGear: (gearId, data) => api.patch(`admin/gear/${gearId}/`, data),
  deleteGear: (gearId) => api.delete(`admin/gear/${gearId}/`),

  // Adventure Kit Bundles CRUD
  getKits: () => api.get("admin/kits/"),
  createKit: (data) => api.post("admin/kits/", data),
  updateKit: (kitId, data) => api.patch(`admin/kits/${kitId}/`, data),
  deleteKit: (kitId) => api.delete(`admin/kits/${kitId}/`),

  // Delivery Partners
  getDeliveryPartners: (partnerId) =>
    partnerId ? api.get(`admin/delivery-partners/${partnerId}/`) : api.get("admin/delivery-partners/"),
  updateDeliveryPartner: (partnerId, data) =>
    api.patch(`admin/delivery-partners/${partnerId}/`, data),

  // Customers
  getCustomers: (userId) =>
    userId ? api.get(`admin/customers/${userId}/`) : api.get("admin/customers/"),

  // Reservations
  getReservations: () => api.get("admin/reservations/"),

  // Returns & Damage Inspection
  inspectOrder: (orderId, data) => api.post(`orders/${orderId}/inspect/`, data),

  // CSV Exports
  downloadCsv: async (type, filename) => {
    const res = await api.get(`admin/export/${type}/`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename || `${type}_export.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

// Recommendation Endpoints
export const recommendationsAPI = {
  getForYou: (limit = 3) => api.get("recommendations/for-you/", { params: { limit } }),
  getSimilar: (gearId, limit = 3) => api.get(`recommendations/similar/${gearId}/`, { params: { limit } }),
  getCustomersAlsoRented: (gearId, limit = 3) =>
    api.get(`recommendations/customers-also-rented/${gearId}/`, { params: { limit } }),
  getTrending: (limit = 3) => api.get("recommendations/trending/", { params: { limit } }),
  getKitAddons: (destination = "Annapurna", limit = 3) =>
    api.get("recommendations/kit-addons/", { params: { destination, limit } }),
  getCompleteYourKit: () => api.get("recommendations/complete-your-kit/"),
  solveGearAdvisor: (answers) => api.post("recommendations/gear-advisor/", answers),
  recordEvent: (recType, gearId, action = "click") =>
    api.post("recommendations/event/", { rec_type: recType, gear_id: gearId, action }),
  getAnalytics: () => api.get("recommendations/analytics/"),
};

// Marketing Funnel & SEO Telemetry Endpoints
export const marketingAPI = {
  recordEvent: (data) => api.post("marketing/events/", data),
  getSummary: () => api.get("marketing/summary/"),
  getSEOHealth: () => api.get("marketing/seo-health/"),
};

export default api;
