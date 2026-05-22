import { useQuery } from '@tanstack/react-query';
import { courseService } from '@/services/courses.service';
import { queryKeys } from '@/shared/api/query-keys';

interface UseCoursesOptions {
  category?: string;
  search?: string;
}

/**
 * Enterprise Query Hook for fetching courses.
 * Clean integration: UI -> Hook -> Query -> Service -> API/Mock
 */
export const useCourses = (options?: UseCoursesOptions) => {
  return useQuery({
    queryKey: queryKeys.courses.list(options || {}),
    queryFn: () => courseService.getCourses(options),
    // Stale time handles scalable caching strategy
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
};

export const useCourseDetail = (id: string) => {
  return useQuery({
    queryKey: queryKeys.courses.detail(id),
    queryFn: () => courseService.getCourseById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  });
};
