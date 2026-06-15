import axios from 'axios';
import { getApiBaseUrl } from '@/shared/lib/api-config';

const API_URL = getApiBaseUrl();

const clearStoredAuth = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('lms_user');
  localStorage.removeItem('impersonation_mode');
};

const extractAuthPayload = (response: any) => response?.data?.data || response?.data || response;

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // important for cookies/refresh tokens
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Global Errors & Token Refresh
api.interceptors.response.use(
  (response) => {
    // Because we standardized responses in the backend: { success, data, metadata }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 Unauthorized and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refresh_token = localStorage.getItem('refresh_token');
        if (refresh_token) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken: refresh_token,
          });
          const authPayload = extractAuthPayload(response);
          localStorage.setItem('access_token', authPayload.accessToken);
          localStorage.setItem('refresh_token', authPayload.refreshToken);
          if (authPayload.user) {
            localStorage.setItem('lms_user', JSON.stringify(authPayload.user));
          }
          return api(originalRequest);
        }
      } catch (err) {
        clearStoredAuth();
        window.location.href = '/auth/login';
      }
    }
    
    // Extract enterprise standardized error format
    const errorMessage = error.response?.data?.message || 'Something went wrong';
    return Promise.reject(new Error(errorMessage));
  }
);
