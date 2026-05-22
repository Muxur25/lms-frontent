/**
 * Enterprise Query Key Factory for TanStack Query
 * 
 * This ensures all query keys are strongly typed, predictable, and scalable.
 * It prevents typos and makes cache invalidation extremely easy.
 */

export const queryKeys = {
  // Auth & User
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    preferences: () => [...queryKeys.user.all, 'preferences'] as const,
  },
  
  // Courses
  courses: {
    all: ['courses'] as const,
    lists: () => [...queryKeys.courses.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.courses.lists(), filters] as const,
    details: () => [...queryKeys.courses.all, 'detail'] as const,
    detail: (id: string | number) => [...queryKeys.courses.details(), id] as const,
    progress: (id: string | number) => [...queryKeys.courses.detail(id), 'progress'] as const,
  },
  
  // Exams & Assessments
  exams: {
    all: ['exams'] as const,
    lists: () => [...queryKeys.exams.all, 'list'] as const,
    detail: (id: string | number) => [...queryKeys.exams.all, 'detail', id] as const,
    session: (id: string | number) => [...queryKeys.exams.detail(id), 'session'] as const,
  },
  
  // Analytics
  analytics: {
    all: ['analytics'] as const,
    dashboard: () => [...queryKeys.analytics.all, 'dashboard'] as const,
    course: (id: string | number) => [...queryKeys.analytics.all, 'course', id] as const,
  },
  
  // AI Features
  ai: {
    all: ['ai'] as const,
    recommendations: () => [...queryKeys.ai.all, 'recommendations'] as const,
    chatHistory: (sessionId: string) => [...queryKeys.ai.all, 'chat', sessionId] as const,
  }
};
