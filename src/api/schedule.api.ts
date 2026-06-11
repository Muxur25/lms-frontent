import { apiClient } from './axios';

export type ScheduleEventType = 'exam' | 'webinar' | 'certificate';
export type ScheduleEventStatus = 'upcoming' | 'live' | 'completed' | 'expired' | 'expiring';

export interface ScheduleEvent {
  id: string;
  sourceId: string;
  type: ScheduleEventType;
  title: string;
  titleRu?: string;
  startsAt: string;
  endsAt?: string;
  date: string;
  time: string;
  location: string;
  status: ScheduleEventStatus;
  accent: string;
  meta?: Record<string, any>;
}

export interface ScheduleDay {
  date: string;
  count: number;
  types: Record<ScheduleEventType, number>;
}

export interface ScheduleResponse {
  from: string;
  to: string;
  events: ScheduleEvent[];
  summary: {
    total: number;
    today: number;
    exams: number;
    webinars: number;
    certificates: number;
    upcoming: number;
    live: number;
    overdue: number;
  };
  days: ScheduleDay[];
}

const unwrap = (response: any) => response?.data?.data || response?.data || response;

export const scheduleApi = {
  get: (params: { from: string; to: string }) =>
    apiClient.get<ScheduleResponse>('/schedule', { params }).then(unwrap),
};
