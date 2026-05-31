import { apiClient } from './axios';

export interface AiRecommendation {
  title: string;
  reason: string;
  color: string;
  match: number;
}

export interface AiTopic {
  t: string;
  p: number;
  c: string;
  status: string;
}

const unwrap = (r: any): any => r.data?.data ?? r.data;

export const aiApi = {
  getRecommendations: (): Promise<{ recommendations: AiRecommendation[]; source: 'ai' | 'mock' }> =>
    apiClient.get('/ai/recommendations').then(unwrap),
  getTopicAnalysis: (): Promise<{ topics: AiTopic[]; source: 'ai' | 'mock' }> =>
    apiClient.get('/ai/topic-analysis').then(unwrap),
};
