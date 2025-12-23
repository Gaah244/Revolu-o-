import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  // Auth
  login: (email, password) =>
    axios.post(`${API}/auth/login`, { email, password }),
  register: (data) => axios.post(`${API}/auth/register`, data),
  getMe: () =>
    axios.get(`${API}/auth/me`, { headers: getAuthHeaders() }),

  // Users
  getUsers: () =>
    axios.get(`${API}/users`, { headers: getAuthHeaders() }),
  getRanking: () =>
    axios.get(`${API}/users/ranking`, { headers: getAuthHeaders() }),
  updateUser: (userId, data) =>
    axios.put(`${API}/users/${userId}`, data, { headers: getAuthHeaders() }),
  deleteUser: (userId) =>
    axios.delete(`${API}/users/${userId}`, { headers: getAuthHeaders() }),

  // Missions
  getMissions: (params = {}) =>
    axios.get(`${API}/missions`, { headers: getAuthHeaders(), params }),
  getMission: (missionId) =>
    axios.get(`${API}/missions/${missionId}`, { headers: getAuthHeaders() }),
  createMission: (data) =>
    axios.post(`${API}/missions`, data, { headers: getAuthHeaders() }),
  acceptMission: (missionId) =>
    axios.post(`${API}/missions/${missionId}/accept`, {}, { headers: getAuthHeaders() }),
  completeMission: (missionId) =>
    axios.post(`${API}/missions/${missionId}/complete`, {}, { headers: getAuthHeaders() }),
  deleteMission: (missionId) =>
    axios.delete(`${API}/missions/${missionId}`, { headers: getAuthHeaders() }),

  // Reports
  getReports: (params = {}) =>
    axios.get(`${API}/reports`, { headers: getAuthHeaders(), params }),
  createReport: (data) =>
    axios.post(`${API}/reports`, data, { headers: getAuthHeaders() }),
  acceptReport: (reportId) =>
    axios.post(`${API}/reports/${reportId}/accept`, {}, { headers: getAuthHeaders() }),
  rejectReport: (reportId) =>
    axios.post(`${API}/reports/${reportId}/reject`, {}, { headers: getAuthHeaders() }),

  // Tools
  getTools: (params = {}) =>
    axios.get(`${API}/tools`, { headers: getAuthHeaders(), params }),
  createTool: (data) =>
    axios.post(`${API}/tools`, data, { headers: getAuthHeaders() }),
  uploadTool: (formData) =>
    axios.post(`${API}/tools/upload`, formData, {
      headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" },
    }),
  downloadTool: (toolId) =>
    axios.get(`${API}/tools/download/${toolId}`, { 
      headers: getAuthHeaders(), 
      responseType: 'blob' 
    }),
  deleteTool: (toolId) =>
    axios.delete(`${API}/tools/${toolId}`, { headers: getAuthHeaders() }),

  // Badges
  getBadges: () =>
    axios.get(`${API}/badges`, { headers: getAuthHeaders() }),
  getUserBadges: (userId) =>
    axios.get(`${API}/badges/user/${userId}`, { headers: getAuthHeaders() }),

  // Chat
  getChatMessages: (limit = 50) =>
    axios.get(`${API}/chat/messages`, { headers: getAuthHeaders(), params: { limit } }),
  sendMessage: (content) =>
    axios.post(`${API}/chat/send`, { content }, { headers: getAuthHeaders() }),
  sendAiMessage: (content) =>
    axios.post(`${API}/chat/ai`, { content }, { headers: getAuthHeaders() }),

  // Stats
  getStats: () =>
    axios.get(`${API}/stats`, { headers: getAuthHeaders() }),
  getCategoryStats: () =>
    axios.get(`${API}/stats/categories`, { headers: getAuthHeaders() }),

  // Site Check
  checkSite: (url) =>
    axios.post(`${API}/site-check`, null, { headers: getAuthHeaders(), params: { url } }),
};

export default api;
