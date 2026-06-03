import { apiClient } from './axios';

export interface TestQuestion {
  id: string;
  type: 'single' | 'multiple' | 'truefalse' | 'text';
  question: string;
  options: string[];
  correctAnswers?: number[];
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  order: number;
}

export interface Exam {
  id: string;
  title: string;
  titleRu?: string;
  description?: string;
  category?: string;
  tags?: string[];
  courseId?: string;
  passingScore: number;
  timeLimitMinutes: number;
  proctored: boolean;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  maxAttempts: number;
  visibility: 'public' | 'department' | 'employees';
  status: string;
  deadline?: string;
  color?: string;
  attempts: number;
  questionsCount: number;
  questions?: any[]; // legacy
  startAt?: string;
  endAt?: string;
  createdAt: string;
}

export interface TestAttempt {
  id: string;
  userId: string;
  testId: string;
  startedAt: string;
  submittedAt?: string;
  score: number;
  passed: boolean;
  timeSpentSeconds: number;
  status: 'in_progress' | 'submitted' | 'expired';
  answers: Record<string, number[]>;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  totalQuestions: number;
}

const extractData = (res: any) => {
  if (res && res.data && typeof res.data === 'object' && 'success' in res.data) {
    return res.data.data;
  }
  return res?.data;
};

export const examsApi = {
  getAll: async () => {
    const res = await apiClient.get<any>('/exams');
    return extractData(res);
  },

  getById: async (id: string) => {
    const res = await apiClient.get<any>(`/exams/${id}`);
    return extractData(res);
  },

  create: async (data: Partial<Exam> & { questions: Partial<TestQuestion>[] }) => {
    const res = await apiClient.post<any>('/exams', data);
    return extractData(res);
  },

  update: async (id: string, data: Partial<Exam>) => {
    const res = await apiClient.patch<any>(`/exams/${id}`, data);
    return extractData(res);
  },

  delete: async (id: string) => {
    const res = await apiClient.delete(`/exams/${id}`);
    return extractData(res);
  },

  // Attempt Workflow
  startAttempt: async (testId: string, password?: string) => {
    try {
      const res = await apiClient.post<any>('/exams/start', { testId, ...(password ? { password } : {}) });
      return extractData(res);
    } catch (err: any) {
      console.error('[startAttempt] ERROR details:', err.response?.data);
      throw err;
    }
  },

  saveAnswer: async (attemptId: string, questionId: string, selectedAnswers: number[]) => {
    const payload = { attemptId, questionId, selectedAnswers };
    console.log('[saveAnswer] payload:', JSON.stringify(payload));
    try {
      const res = await apiClient.patch<any>('/exams/attempt/save-answer', payload);
      return extractData(res);
    } catch (err: any) {
      console.error('[saveAnswer] 400 details:', err.response?.data);
      throw err;
    }
  },

  submitAttempt: async (attemptId: string) => {
    const payload = { attemptId };
    console.log('[submitAttempt] payload:', JSON.stringify(payload));
    try {
      const res = await apiClient.post<any>('/exams/attempt/submit', payload);
      return extractData(res);
    } catch (err: any) {
      const d = err.response?.data;
      console.error('[submitAttempt] ERROR:', JSON.stringify(d));
      throw err;
    }
  },

  getMyAttempts: async () => {
    const res = await apiClient.get<any>('/exams/my-attempts');
    return extractData(res);
  },

  getActiveAttempt: async (testId: string) => {
    const res = await apiClient.get<any>(`/exams/${testId}/attempt/active`);
    return extractData(res);
  },

  verifyAttempt: async (attemptId: string) => {
    const res = await apiClient.get<any>(`/exams/attempt/${attemptId}/verify`);
    return extractData(res);
  },
};
