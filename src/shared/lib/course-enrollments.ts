export type EnrollmentStatus = 'all' | 'in-progress' | 'completed';

export interface EnrolledCourse {
  enrollmentId: string;
  courseId: string;
  progress: number;
  status: Exclude<EnrollmentStatus, 'all'>;
  enrolledAt: string;
  course: {
    id: string;
    title: string;
    titleRu?: string;
    cat?: string;
    catRu?: string;
    level?: string;
    color?: string;
    instructor?: string;
    lessons?: number;
    duration?: string;
    rating?: number;
    status?: string;
  } | null;
}

export function clampProgress(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(100, Math.max(0, Math.round(numeric)));
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function normalizeEnrollmentStatus(
  status: unknown,
  progress: number,
): Exclude<EnrollmentStatus, 'all'> {
  const normalized = String(status || '').toLowerCase().replace(/_/g, '-');
  if (['completed', 'complete', 'finished', 'done'].includes(normalized) || progress >= 100) {
    return 'completed';
  }
  return 'in-progress';
}

export function normalizeEnrollment(item: unknown): EnrolledCourse | null {
  if (!isRecord(item)) return null;

  const rawCourse = item.course || item.courseData || item;
  if (!isRecord(rawCourse)) return null;

  const courseId = item.courseId || rawCourse.id || rawCourse._id;
  if (!courseId) return null;

  const progress = clampProgress(item.progress ?? item.completion ?? rawCourse.progress ?? rawCourse.completion);

  return {
    enrollmentId: String(item.enrollmentId || item.id || item._id || courseId),
    courseId: String(courseId),
    progress,
    status: normalizeEnrollmentStatus(item.status, progress),
    enrolledAt: String(item.enrolledAt || item.createdAt || ''),
    course: {
      id: String(courseId),
      title: String(rawCourse.title || ''),
      titleRu: typeof rawCourse.titleRu === 'string' ? rawCourse.titleRu : undefined,
      cat: typeof rawCourse.cat === 'string' ? rawCourse.cat : typeof rawCourse.category === 'string' ? rawCourse.category : undefined,
      catRu: typeof rawCourse.catRu === 'string' ? rawCourse.catRu : typeof rawCourse.categoryRu === 'string' ? rawCourse.categoryRu : undefined,
      level: typeof rawCourse.level === 'string' ? rawCourse.level : undefined,
      color: typeof rawCourse.color === 'string' ? rawCourse.color : undefined,
      instructor: typeof rawCourse.instructor === 'string' ? rawCourse.instructor : undefined,
      lessons: Number.isFinite(Number(rawCourse.lessons)) ? Number(rawCourse.lessons) : undefined,
      duration: typeof rawCourse.duration === 'string' ? rawCourse.duration : undefined,
      rating: Number.isFinite(Number(rawCourse.rating)) ? Number(rawCourse.rating) : undefined,
      status: typeof rawCourse.status === 'string' ? rawCourse.status : undefined,
    },
  };
}

export function getResponseList(response: unknown) {
  if (!isRecord(response)) return [];
  const payload = response.data;
  const data = isRecord(payload) && 'data' in payload ? payload.data : payload;
  if (Array.isArray(data)) return data;
  if (isRecord(data) && Array.isArray(data.items)) return data.items;
  if (isRecord(data) && Array.isArray(data.results)) return data.results;
  return [];
}

export function sortCurrentEnrollments(enrollments: EnrolledCourse[]) {
  return [...enrollments].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'in-progress' ? -1 : 1;
    }
    const aTime = Date.parse(a.enrolledAt || '');
    const bTime = Date.parse(b.enrolledAt || '');
    return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
  });
}

