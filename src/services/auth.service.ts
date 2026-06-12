import { apiClient } from '@/api/axios';

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

class AuthService {
  async login(data: LoginDTO): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  }

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  }

  async validateSession(): Promise<AuthResponse['user']> {
    const response = await apiClient.get<AuthResponse['user']>('/auth/me');
    return response.data;
  }
}

export const authService = new AuthService();
