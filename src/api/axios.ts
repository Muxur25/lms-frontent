import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { getApiBaseUrl } from '@/shared/lib/api-config';

const API_URL = getApiBaseUrl();
const extractAuthPayload = (response: any) => response?.data?.data || response?.data || response;

// Create a configured Axios instance for enterprise API calls
export const apiClient = axios.create({
  baseURL: API_URL,
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

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });
          const authPayload = extractAuthPayload(response);
          if (authPayload?.accessToken && authPayload?.refreshToken) {
            const { login, user } = useAuthStore.getState();
            login(authPayload.user || user, authPayload.accessToken, authPayload.refreshToken);
            originalRequest.headers.Authorization = `Bearer ${authPayload.accessToken}`;
            return apiClient(originalRequest);
          }
        }
      } catch {
        // Continue with local logout below.
      }

      const { clearAuth } = useAuthStore.getState();
      clearAuth();
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);
