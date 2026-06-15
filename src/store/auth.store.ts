import { create } from 'zustand';
import axios from 'axios';
import type { EnterpriseRole } from '@/shared/lib/auth-user';
import { getApiBaseUrl } from '@/shared/lib/api-config';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  role: EnterpriseRole;
  roleLabel?: string;
  departmentId?: string;
  department?: string;
  departmentName?: string;
  organizationCode?: string;
  position?: string;
  notificationPreferences?: Record<string, boolean>;
  roles: string[];
  xp?: number;
  level?: number;
  title?: string;
  employeeId?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  maxDevicesReached: boolean;
  pendingDevices: any[];
  impersonationMode: boolean;
  setImpersonationMode: (val: boolean) => void;
  setMaxDevices: (reached: boolean, devices?: any[]) => void;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  updateUser: (user: Partial<User>) => void;
}

const API_URL = getApiBaseUrl();
const storedUser = localStorage.getItem('lms_user');
const storedToken = localStorage.getItem('access_token');
const parseStoredUser = () => {
  if (!storedUser) return null;
  try {
    return JSON.parse(storedUser);
  } catch {
    clearStoredAuth();
    return null;
  }
};

const clearStoredAuth = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('lms_user');
  localStorage.removeItem('impersonation_mode');
};

export const useAuthStore = create<AuthState>((set) => ({
  user: parseStoredUser(),
  isAuthenticated: Boolean(storedToken && parseStoredUser()),
  // If we already have stored credentials, auth is already resolved (no loading needed)
  isLoading: !storedToken,
  
  maxDevicesReached: false,
  pendingDevices: [],
  impersonationMode: localStorage.getItem('impersonation_mode') === 'true',
  
  setImpersonationMode: (val) => {
    if (val) localStorage.setItem('impersonation_mode', 'true');
    else localStorage.removeItem('impersonation_mode');
    set({ impersonationMode: val });
  },

  setMaxDevices: (reached, devices = []) => set({ maxDevicesReached: reached, pendingDevices: devices }),

  login: (user, accessToken, refreshToken) => {
    if (!user || !accessToken || !refreshToken) {
      clearStoredAuth();
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('lms_user', JSON.stringify(user));
    set({ user, isAuthenticated: true, isLoading: false, maxDevicesReached: false, pendingDevices: [] });
  },

  clearAuth: () => {
    clearStoredAuth();
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      maxDevicesReached: false,
      pendingDevices: [],
      impersonationMode: false,
    });
  },

  logout: async () => {
    const token = localStorage.getItem('access_token');

    try {
      if (token) {
        await axios.post(`${API_URL}/auth/logout`, undefined, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // Local logout must still complete if the session is already expired or revoked.
    } finally {
      clearStoredAuth();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        maxDevicesReached: false,
        pendingDevices: [],
        impersonationMode: false,
      });
    }
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  updateUser: (updatedFields) => set((state) => {
    if (!state.user) return {};
    const newUser = { ...state.user, ...updatedFields };
    localStorage.setItem('lms_user', JSON.stringify(newUser));
    return { user: newUser };
  }),
}));
