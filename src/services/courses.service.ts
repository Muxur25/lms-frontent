import { apiClient } from '@/api/axios';
import { mockDelay } from '@/utils/mockDelay';

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  progress: number;
  instructor: string;
  duration: string;
}

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';

// MOCK DATA
const mockCourses: Course[] = [
  {
    id: 'c_1',
    title: 'Sanoat Xavfsizligi Asoslari',
    description: 'Korxonada xavfsizlik qoidalarini o\'rganing.',
    thumbnail: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80',
    progress: 45,
    instructor: 'Alijon Valiyev',
    duration: '4 soat'
  },
  {
    id: 'c_2',
    title: 'Menejment va Etika',
    description: 'Xodimlar bilan samarali ishlash usullari.',
    thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80',
    progress: 12,
    instructor: 'Rustam Qodirov',
    duration: '6 soat'
  }
];

class CourseService {
  async getCourses(params?: { category?: string; search?: string }): Promise<Course[]> {
    if (USE_MOCKS) {
      await mockDelay(1200); // Simulate large dataset fetching
      
      let filtered = mockCourses;
      if (params?.search) {
        filtered = filtered.filter(c => c.title.toLowerCase().includes(params.search!.toLowerCase()));
      }
      return filtered;
    }
    
    const response = await apiClient.get<Course[]>('/courses', { params });
    return response.data;
  }

  async getCourseById(id: string): Promise<Course> {
    if (USE_MOCKS) {
      await mockDelay(600);
      const course = mockCourses.find(c => c.id === id);
      if (!course) throw new Error('Course not found');
      return course;
    }
    
    const response = await apiClient.get<Course>(`/courses/${id}`);
    return response.data;
  }
}

export const courseService = new CourseService();
