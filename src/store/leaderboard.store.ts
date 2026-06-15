import { create } from 'zustand';
import { apiClient } from '@/api/axios';

export type LeaderboardTimeFilter = 'all_time' | 'month' | 'week' | 'today';

export interface LeaderboardRanking {
  id: string;
  userId: string;
  userFullName: string;
  userDepartment?: string;
  departmentId?: string | null;
  departmentName?: string;
  organizationCode?: string | null;
  userAvatar?: string;
  totalPoints: number;
  periodPoints: number;
  rank: number;
  stars: number;
  completedCourses?: number;
  lastUpdated?: string;
}

export interface DepartmentLeaderboardRanking {
  rank: number;
  departmentId: string;
  departmentName: string;
  displayName: string;
  organizationCode: string;
  participants: number;
  points: number;
}

export interface UserPoints {
  id: string;
  userId: string;
  sourceType: string;
  sourceId: string;
  pointsAwarded: number;
  totalPoints?: number;
  createdAt: string;
}

interface LeaderboardState {
  rankings: LeaderboardRanking[];
  departmentRankings: DepartmentLeaderboardRanking[];
  history: UserPoints[];
  myRanking: LeaderboardRanking | null;
  timeFilter: LeaderboardTimeFilter;
  loading: boolean;
  departmentLoading: boolean;
  historyLoading: boolean;
  error: string | null;
  departmentError: string | null;

  setTimeFilter: (filter: LeaderboardTimeFilter) => void;
  fetchRankings: (filter?: LeaderboardTimeFilter) => Promise<void>;
  fetchDepartmentRankings: (filter?: LeaderboardTimeFilter) => Promise<void>;
  fetchMyRanking: () => Promise<void>;
  fetchMyHistory: () => Promise<void>;
  subscribeToEvents: (socket: any, userId: string) => void;
  unsubscribeFromEvents: (socket: any) => void;
}

const unwrap = (response: any) => response?.data?.data || response?.data || response;

const normalizeRanking = (item: any, index = 0): LeaderboardRanking => ({
  id: item.id || item.userId || `ranking-${index}`,
  userId: item.userId,
  userFullName: item.userFullName || item.fullName || 'AGMK xodimi',
  userDepartment: item.userDepartment || item.department || item.departmentName || '',
  departmentId: item.departmentId || null,
  departmentName: item.departmentName || item.department || '',
  organizationCode: item.organizationCode || null,
  userAvatar: item.userAvatar || item.avatar || '',
  totalPoints: Number(item.totalPoints || item.points || 0),
  periodPoints: Number(item.periodPoints || item.points || item.totalPoints || 0),
  rank: Number(item.rank || item.rankPosition || index + 1),
  stars: Number(item.stars || 1),
  completedCourses: Number(item.completedCourses || item.coursesCount || 0),
  lastUpdated: item.lastUpdated || item.updatedAt,
});

const normalizeDepartmentRanking = (item: any, index = 0): DepartmentLeaderboardRanking => {
  const departmentName = item.departmentName || item.name || item.department || '';
  const organizationCode = item.organizationCode || '';
  return {
    rank: Number(item.rank || index + 1),
    departmentId: item.departmentId || `${organizationCode}:${departmentName}` || `department-${index}`,
    departmentName,
    displayName: item.displayName || (organizationCode && departmentName ? `${organizationCode} · ${departmentName}` : departmentName),
    organizationCode,
    participants: Number(item.participants || 0),
    points: Number(item.points || item.totalPoints || 0),
  };
};

const normalizeHistory = (item: any): UserPoints => ({
  id: item.id,
  userId: item.userId,
  sourceType: item.sourceType,
  sourceId: item.sourceId,
  pointsAwarded: Number(item.pointsAwarded || item.points || 0),
  totalPoints: Number(item.totalPoints || 0),
  createdAt: item.createdAt,
});

export const useLeaderboardStore = create<LeaderboardState>((set, get) => ({
  rankings: [],
  departmentRankings: [],
  history: [],
  myRanking: null,
  timeFilter: 'all_time',
  loading: false,
  departmentLoading: false,
  historyLoading: false,
  error: null,
  departmentError: null,

  setTimeFilter: (filter) => {
    set({ timeFilter: filter });
    get().fetchRankings(filter);
    get().fetchDepartmentRankings(filter);
  },

  fetchRankings: async (filter) => {
    const timeFilter = filter || get().timeFilter;
    set({ loading: true, error: null });
    try {
      const payload = await apiClient
        .get('/leaderboard/global', { params: { timeFilter } })
        .then(unwrap);
      const rankings = Array.isArray(payload)
        ? payload.map(normalizeRanking)
        : [];
      set({ rankings, loading: false });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to fetch leaderboard',
        loading: false,
      });
    }
  },

  fetchDepartmentRankings: async (filter) => {
    const timeFilter = filter || get().timeFilter;
    set({ departmentLoading: true, departmentError: null });
    try {
      const payload = await apiClient
        .get('/leaderboard/departments', { params: { timeFilter } })
        .then(unwrap);
      const departmentRankings = Array.isArray(payload) ? payload.map(normalizeDepartmentRanking) : [];
      set({ departmentRankings, departmentLoading: false });
    } catch (err: any) {
      console.error('Failed to fetch department rankings', err);
      set({
        departmentError: err?.response?.data?.message || err?.message || 'Failed to fetch department rankings',
        departmentLoading: false,
      });
    }
  },

  fetchMyRanking: async () => {
    try {
      const payload = await apiClient.get('/leaderboard/me').then(unwrap);
      const current = normalizeRanking({
        ...payload,
        rank: payload?.rankPosition,
        userId: payload?.userId || '',
        fullName: payload?.fullName || '',
      });
      set({ myRanking: current });
    } catch (err: any) {
      if (err?.response?.status === 404) {
        set({ myRanking: null });
        return;
      }
      set({ error: err?.response?.data?.message || err?.message || 'Failed to fetch my ranking' });
    }
  },

  fetchMyHistory: async () => {
    set({ historyLoading: true });
    try {
      const payload = await apiClient.get('/leaderboard/me/history').then(unwrap);
      set({
        history: Array.isArray(payload) ? payload.map(normalizeHistory) : [],
        historyLoading: false,
      });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || err?.message || 'Failed to fetch history',
        historyLoading: false,
      });
    }
  },

  subscribeToEvents: (socket: any, userId: string) => {
    if (!socket) return;

    socket.off('leaderboard.updated');
    socket.off('leaderboard.my_points_updated');

    socket.on('leaderboard.updated', () => {
      get().fetchRankings();
    });

    socket.on('leaderboard.my_points_updated', (payload: any) => {
      if (payload.userId === userId) {
        get().fetchMyRanking();
        get().fetchMyHistory();
      }
    });
  },

  unsubscribeFromEvents: (socket: any) => {
    if (!socket) return;
    socket.off('leaderboard.updated');
    socket.off('leaderboard.my_points_updated');
  },
}));
