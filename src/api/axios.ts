import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

// Create a configured Axios instance for enterprise API calls
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.agmk-lms.uz/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor to automatically attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
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
    
    // Handle 401 Unauthorized globally
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Example refresh logic
        // const { data } = await axios.post('/auth/refresh');
        // useAuthStore.getState().setToken(data.token);
        // return apiClient(originalRequest);
        
        // If refresh fails, logout user
        useAuthStore.getState().logout();
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
