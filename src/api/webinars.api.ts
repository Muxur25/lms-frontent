import { apiClient } from './axios';

export interface Webinar {
  id: string;
  title: string;
  titleRu?: string;
  scheduledAt: string;
  durationMinutes?: number;
  imageUrl?: string;
  meetingLink: string;
  speaker?: string;
  joinCount: number;
}

const unwrap = (r: any): any => r.data?.data ?? r.data;

export const webinarsApi = {
  getAll: () => apiClient.get('/webinars').then(unwrap),
  create: (data: Omit<Webinar, 'id' | 'joinCount'>) => apiClient.post('/webinars', data).then(unwrap),
  update: (id: string, data: Partial<Webinar>) => apiClient.patch(`/webinars/${id}`, data).then(unwrap),
  delete: (id: string) => apiClient.delete(`/webinars/${id}`),
  join: (id: string) => apiClient.post(`/webinars/${id}/join`).then(unwrap),
};
