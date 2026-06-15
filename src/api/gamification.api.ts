import { apiClient } from './axios';

export interface GamificationWeekDay {
  date: string;
  active: boolean;
  isToday: boolean;
}

export interface GamificationSummary {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  claimedBonuses: string[];
  nextBonus: { days: number; xp: number; daysRemaining: number } | null;
  weekActivity: GamificationWeekDay[];
  xp: number;
  level: number;
  title: string;
  titleKey?: string;
  levelBaseXp?: number;
  nextLevelXp: number;
  xpToNextLevel?: number;
  levelProgress: number;
  cacheOutOfSync?: boolean;
}

const unwrap = (r: any): any => r.data?.data ?? r.data;

export const gamificationApi = {
  getMySummary: (): Promise<GamificationSummary> =>
    apiClient.get('/gamification/me').then(unwrap),
};
