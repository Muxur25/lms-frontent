import { apiClient } from '@/api/axios';

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  progress: number;
  instructor: string;
  duration: string;
}

class CourseService {
  async getCourses(params?: { category?: string; search?: string; language?: string }): Promise<Course[]> {
    const response = await apiClient.get<Course[]>('/courses', { params });
    return response.data;
  }

  async getCourseById(id: string): Promise<Course> {
    const response = await apiClient.get<Course>(`/courses/${id}`);
    return response.data;
  }
}

export const courseService = new CourseService();
