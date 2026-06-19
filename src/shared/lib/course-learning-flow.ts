export type CourseLessonType = 'video' | 'quiz' | 'assignment';

export interface CourseLessonFlowItem {
  id: string | number;
  type: CourseLessonType;
  videoUrl?: string;
  done?: boolean;
  quizData?: any;
}

export interface CourseModuleFlowItem {
  items?: CourseLessonFlowItem[];
}

export function hasQuizQuestions(lesson?: CourseLessonFlowItem | null) {
  return Array.isArray(lesson?.quizData?.questions) && lesson.quizData.questions.length > 0;
}

export function hasLessonContent(lesson?: CourseLessonFlowItem | null) {
  if (!lesson) return false;
  if (lesson.type === 'quiz') return hasQuizQuestions(lesson);
  return Boolean(lesson.videoUrl?.trim());
}

export function isProgressLesson(lesson?: CourseLessonFlowItem | null) {
  return Boolean(lesson && hasLessonContent(lesson));
}

export function getLessonSequence<TLesson extends CourseLessonFlowItem>(
  modules: Array<{ items?: TLesson[] }>,
) {
  return modules.flatMap(module => module.items || []);
}

export function isLessonUnlockedInSequence(
  allLessons: CourseLessonFlowItem[],
  lessonId: string | number,
) {
  const targetIndex = allLessons.findIndex(item => item.id === lessonId);
  if (targetIndex <= 0) return true;
  const target = allLessons[targetIndex];
  if (!target || target.type === 'assignment') return true;
  return allLessons
    .slice(0, targetIndex)
    .filter(item => item.type !== 'assignment' && isProgressLesson(item))
    .every(item => item.done);
}

export function getResumeLesson<TLesson extends CourseLessonFlowItem>(
  modules: Array<{ items?: TLesson[] }>,
) {
  const allLessons = getLessonSequence(modules);
  return allLessons.find((lesson) =>
    isProgressLesson(lesson) &&
    !lesson.done &&
    isLessonUnlockedInSequence(allLessons, lesson.id)
  ) || allLessons.find(isProgressLesson) || allLessons[0] || null;
}

export function getModuleProgressStats<TLesson extends CourseLessonFlowItem>(
  module: { items?: TLesson[] },
) {
  const progressItems = (module.items || []).filter(isProgressLesson);
  return {
    total: progressItems.length,
    done: progressItems.filter(item => item.done).length,
  };
}
