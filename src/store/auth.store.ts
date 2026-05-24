import { create } from 'zustand';
import type { EnterpriseRole } from '@/shared/lib/auth-user';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  role: EnterpriseRole;
  roleLabel?: string;
  department?: string;
  position?: string;
  roles: string[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  updateUser: (user: Partial<User>) => void;
}

const storedUser = localStorage.getItem('lms_user');
const storedToken = localStorage.getItem('access_token');

export const useAuthStore = create<AuthState>((set) => ({
  user: storedUser ? JSON.parse(storedUser) : null,
  isAuthenticated: !!storedToken,
  // If we already have stored credentials, auth is already resolved (no loading needed)
  isLoading: !storedToken,
  
  login: (user, accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('lms_user', JSON.stringify(user));
    set({ user, isAuthenticated: true, isLoading: false });
  },
  
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('lms_user');
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  updateUser: (updatedFields) => set((state) => {
    if (!state.user) return {};
    const newUser = { ...state.user, ...updatedFields };
    localStorage.setItem('lms_user', JSON.stringify(newUser));
    return { user: newUser };
  }),
}));
