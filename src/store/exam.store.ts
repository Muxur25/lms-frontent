import { create } from 'zustand';
import { examsApi } from '../api/exams.api';
import type { Exam, TestAttempt } from '../api/exams.api';

interface ExamState {
  exams: Exam[];
  activeAttempt: TestAttempt | null;
  history: TestAttempt[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadExams: () => Promise<void>;
  loadHistory: () => Promise<void>;
  startExam: (testId: string) => Promise<void>;
  saveAnswerLocally: (questionId: string, selectedAnswers: number[]) => void;
  syncAnswers: () => Promise<void>;
  submitExam: () => Promise<void>;
}

export const useExamStore = create<ExamState>((set, get) => ({
  exams: [],
  activeAttempt: null,
  history: [],
  isLoading: false,
  error: null,

  loadExams: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await examsApi.getAll();
      // Safely handle different response formats (e.g., { data: [...] } or [...])
      const data = (res as any)?.data || res || [];
      const safeExams = Array.isArray(data) ? data : [];
      
      set({ exams: safeExams, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  loadHistory: async () => {
    try {
      const history = await examsApi.getMyAttempts();
      set({ history });
    } catch (error: any) {
      console.error('Failed to load attempt history', error);
    }
  },

  startExam: async (testId: string) => {
    set({ isLoading: true, error: null });
    try {
      // First check if there's an active one
      let attempt = await examsApi.getActiveAttempt(testId).catch(() => null);
      if (!attempt) {
        attempt = await examsApi.startAttempt(testId);
      }
      set({ activeAttempt: attempt, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || error.message, isLoading: false });
      throw error;
    }
  },

  saveAnswerLocally: (questionId: string, selectedAnswers: number[]) => {
    const { activeAttempt } = get();
    if (!activeAttempt) return;

    set({
      activeAttempt: {
        ...activeAttempt,
        answers: {
          ...activeAttempt.answers,
          [questionId]: selectedAnswers,
        },
      },
    });
  },

  syncAnswers: async () => {
    const { activeAttempt } = get();
    if (!activeAttempt) return;

    // To keep it simple, we sync the last modified answer.
    // In a robust implementation, we would queue updates.
    // We'll rely on the backend saveAnswer API if we wanted to sync individual,
    // but we can also just use the auto-sync interval locally in the component.
    // We'll expose this logic from the component.
  },

  submitExam: async () => {
    const { activeAttempt } = get();
    if (!activeAttempt) return;

    set({ isLoading: true });
    try {
      const result = await examsApi.submitAttempt(activeAttempt.id, activeAttempt.answers);
      set({ activeAttempt: result, isLoading: false }); // will be marked as 'submitted'
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
}));
