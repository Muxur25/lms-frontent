import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

// Create a configured Axios instance for enterprise API calls
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor to automatically attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Also attach preferred language
    config.headers['Accept-Language'] = localStorage.getItem('i18nextLng') || 'uz';
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for global error handling and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized globally — only logout if not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Clear stale credentials and let ProtectedRoute handle redirect
      const { logout } = useAuthStore.getState();
      logout();

      // Do NOT reject with error here — just silently logout.
      // ProtectedRoute will redirect to /auth/login automatically.
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);
