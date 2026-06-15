import { apiClient } from './axios';

export type AiSource = 'ai' | 'fallback';
export type AiLanguage = 'uz' | 'ru';

export interface AiRecommendation {
  id?: string;
  title: string;
  reason: string;
  color: string;
  match: number;
  courseId?: string;
  createdAt?: string;
  source?: AiSource;
  language?: AiLanguage;
}

export interface AiRecommendationsResponse {
  recommendations: AiRecommendation[];
  source: AiSource;
  language?: AiLanguage;
  dateKey?: string;
  createdAt?: string;
}

export interface AiRecommendationHistoryResponse {
  recommendations: AiRecommendation[];
  days?: AiRecommendationsResponse[];
  source: AiSource;
  language?: AiLanguage;
}

export interface AiTopic {
  t: string;
  p: number;
  c: string;
  status: string;
}

const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;
const fallbackColors = ['#8b5cf6', '#3b82f6', '#22c55e'];

const unwrap = (r: any): any => r.data?.data ?? r.data;

function clampMatch(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(100, Math.max(0, Math.round(numeric)));
}

function normalizeLanguage(language?: string): AiLanguage {
  return String(language || '').toLowerCase().startsWith('ru') ? 'ru' : 'uz';
}

function normalizeSource(source?: string): AiSource {
  return source === 'ai' ? 'ai' : 'fallback';
}

function normalizeRecommendation(item: any, index: number, source?: AiSource, language?: AiLanguage): AiRecommendation | null {
  if (!item || typeof item !== 'object') return null;
  const title = String(item.title || '').trim();
  const reason = String(item.reason || '').trim();
  if (!title || !reason) return null;
  const color = String(item.color || '');
  return {
    id: item.id ? String(item.id) : undefined,
    title,
    reason,
    color: HEX_COLOR_RE.test(color) ? color : fallbackColors[index % fallbackColors.length],
    match: clampMatch(item.match),
    courseId: item.courseId ? String(item.courseId) : undefined,
    createdAt: item.createdAt ? String(item.createdAt) : undefined,
    source: normalizeSource(item.source || source),
    language: normalizeLanguage(item.language || language),
  };
}

function normalizeRecommendationsResponse(payload: any): AiRecommendationsResponse {
  const source = normalizeSource(payload?.source);
  const language = normalizeLanguage(payload?.language);
  const recommendations = Array.isArray(payload?.recommendations)
    ? payload.recommendations
      .map((item: any, index: number) => normalizeRecommendation(item, index, source, language))
      .filter(Boolean)
    : [];
  return {
    recommendations,
    source,
    language,
    dateKey: payload?.dateKey,
    createdAt: payload?.createdAt,
  };
}

function normalizeHistoryResponse(payload: any): AiRecommendationHistoryResponse {
  const source = normalizeSource(payload?.source);
  const language = normalizeLanguage(payload?.language);
  const recommendations = Array.isArray(payload?.recommendations)
    ? payload.recommendations
      .map((item: any, index: number) => normalizeRecommendation(item, index, source, language))
      .filter(Boolean)
    : [];
  const days = Array.isArray(payload?.days)
    ? payload.days.map(normalizeRecommendationsResponse)
    : [];
  return { recommendations, days, source, language };
}

export const aiApi = {
  getRecommendations: (language?: string): Promise<AiRecommendationsResponse> =>
    apiClient.get('/ai/recommendations', { params: { language } }).then(unwrap).then(normalizeRecommendationsResponse),
  getRecommendationHistory: (language?: string): Promise<AiRecommendationHistoryResponse> =>
    apiClient.get('/ai/recommendations/history', { params: { language } }).then(unwrap).then(normalizeHistoryResponse),
  getTopicAnalysis: (): Promise<{ topics: AiTopic[]; source: AiSource }> =>
    apiClient.get('/ai/topic-analysis').then(unwrap),
};
