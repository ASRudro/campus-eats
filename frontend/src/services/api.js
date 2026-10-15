import axios from 'axios';

const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    const port = window.location.port;
    if (port === '3000' || port === '5000') {
      return '/api';
    }
    // Live Server / Five Server or direct preview
    return 'http://localhost:5000/api';
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: attach JWT token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('campuseats_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: capture 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized, clear invalid token
      if (localStorage.getItem('campuseats_token')) {
        localStorage.removeItem('campuseats_token');
        localStorage.removeItem('campuseats_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
