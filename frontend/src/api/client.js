import axios from 'axios';

// In production the API lives on a separate Render service, so VITE_API_URL
// holds its full URL (e.g. https://attendix-api.onrender.com/api).
// Locally it's unset, so we fall back to '/api' and let the Vite dev proxy handle it.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('attendix_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to catch unauthorized errors and capture sliding-session token
apiClient.interceptors.response.use(
  (response) => {
    const refreshed = response.headers['x-refreshed-token'];
    if (refreshed) {
      localStorage.setItem('attendix_token', refreshed);
    }
    return response.data; // Strips boilerplate to returned payload directly
  },
  (error) => {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem('attendix_token');
      localStorage.removeItem('attendix_user');
      window.dispatchEvent(new Event('auth-logout'));
    }
    return Promise.reject(error.response ? error.response.data : error);
  }
);

export default apiClient;
