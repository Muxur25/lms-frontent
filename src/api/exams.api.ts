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

export const examsApi = {
  getAll: async () => {
    const res = await apiClient.get<Exam[]>('/exams');
    return res.data;
  },

  getById: async (id: string) => {
    const res = await apiClient.get<Exam>(`/exams/${id}`);
    return res.data;
  },

  create: async (data: Partial<Exam> & { questions: Partial<TestQuestion>[] }) => {
    const res = await apiClient.post<Exam>('/exams', data);
    return res.data;
  },

  update: async (id: string, data: Partial<Exam>) => {
    const res = await apiClient.patch<Exam>(`/exams/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await apiClient.delete(`/exams/${id}`);
    return res.data;
  },

  // Attempt Workflow
  startAttempt: async (testId: string) => {
    const res = await apiClient.post<TestAttempt>('/exams/start', { testId });
    return res.data;
  },

  saveAnswer: async (attemptId: string, questionId: string, selectedAnswers: number[]) => {
    const res = await apiClient.patch<TestAttempt>('/exams/attempt/save-answer', {
      attemptId,
      questionId,
      selectedAnswers,
    });
    return res.data;
  },

  submitAttempt: async (attemptId: string, finalAnswers?: Record<string, number[]>) => {
    const res = await apiClient.post<TestAttempt>('/exams/attempt/submit', {
      attemptId,
      answers: finalAnswers,
    });
    return res.data;
  },

  getMyAttempts: async () => {
    const res = await apiClient.get<TestAttempt[]>('/exams/my-attempts');
    return res.data;
  },

  getActiveAttempt: async (testId: string) => {
    const res = await apiClient.get<TestAttempt>(`/exams/${testId}/attempt/active`);
    return res.data;
  },
};
