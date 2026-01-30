import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? '/api'  // Same domain in Railway production
    : (process.env.REACT_APP_API_URL || 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Problems API
export const problemsAPI = {
  getAll: (params = {}) => api.get('/problems', { params }),
  getById: (id) => api.get(`/problems/${id}`),
  search: (query, params = {}) => api.get(`/problems/search/${encodeURIComponent(query)}`, { params }),
  getStats: () => api.get('/problems/meta/stats'),
};

// Execution API
export const executionAPI = {
  submit: (data) => api.post('/execution/submit', data),
  getStatus: (submissionId) => api.get(`/execution/status/${submissionId}`),
  getJobStatus: (jobId) => api.get(`/execution/job/${jobId}`),
};

// Submissions API
export const submissionsAPI = {
  getAll: (params = {}) => api.get('/submissions', { params }),
  getById: (id) => api.get(`/submissions/${id}`),
  getStats: () => api.get('/submissions/stats/overview'),
  getProblemStats: (problemId) => api.get(`/submissions/stats/problem/${problemId}`),
};

// Statistics API
export const statsAPI = {
  getPlatform: () => api.get('/stats/platform'),
  getUser: (userId) => api.get(`/stats/user/${userId}`),
  getLeaderboard: (params = {}) => api.get('/stats/leaderboard', { params }),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health', { baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000' }),
};

export default api;