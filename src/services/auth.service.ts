import { apiClient } from '@/api/axios';
import { mockDelay } from '@/utils/mockDelay';

export interface LoginDTO {
  email: string;
  password?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  token: string;
  refreshToken: string;
}

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false'; // Default to true if not explicitly disabled

class AuthService {
  async login(data: LoginDTO): Promise<AuthResponse> {
    if (USE_MOCKS) {
      await mockDelay(1000); // Simulate network
      return {
        user: {
          id: 'user_123',
          name: 'Admin',
          email: data.email,
          role: 'admin',
        },
        token: 'mock_jwt_token_header.payload.signature',
        refreshToken: 'mock_refresh_token_string'
      };
    }
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  }

  async logout(): Promise<void> {
    if (USE_MOCKS) {
      await mockDelay(500);
      return;
    }
    await apiClient.post('/auth/logout');
  }

  async validateSession(): Promise<AuthResponse['user']> {
    if (USE_MOCKS) {
      await mockDelay(400);
      return {
        id: 'user_123',
        name: 'Admin',
        email: 'admin@agmk.uz',
        role: 'admin',
      };
    }
    const response = await apiClient.get<AuthResponse['user']>('/auth/me');
    return response.data;
  }
}

export const authService = new AuthService();
