import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('./src/shared/lib/course-learning-flow.ts', import.meta.url), 'utf8');
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

const flow = await import(`data:text/javascript;base64,${Buffer.from(transpiled).toString('base64')}`);

const lessons = [
  { id: 'video-1', type: 'video', videoUrl: '/api/v1/uploads/download/1', done: true },
  { id: 'empty-video', type: 'video', videoUrl: '', done: false },
  { id: 'quiz-1', type: 'quiz', quizData: { questions: [{ id: 'q1' }] }, done: false },
  { id: 'assignment-1', type: 'assignment', videoUrl: '/api/v1/uploads/download/a', done: false },
  { id: 'video-2', type: 'video', videoUrl: '/api/v1/uploads/download/2', done: false },
];
const modules = [{ items: lessons }];

assert.equal(
  flow.getResumeLesson(modules)?.id,
  'quiz-1',
  'completedLessons/done bo‘lsa resume keyingi kontentli darsni ochishi kerak',
);

assert.equal(flow.isProgressLesson(lessons[1]), false, 'kontenti yo‘q video progressga kirmasligi kerak');
assert.deepEqual(
  flow.getModuleProgressStats(modules[0]),
  { total: 4, done: 1 },
  'progress denominator faqat kontentli darslardan iborat bo‘lishi kerak',
);

assert.equal(flow.isLessonUnlockedInSequence(lessons, 'quiz-1'), true, 'bo‘sh video keyingi quizni bloklamasligi kerak');
assert.equal(flow.isLessonUnlockedInSequence(lessons, 'assignment-1'), true, 'assignment doim ochiq bo‘lishi kerak');
assert.equal(flow.isLessonUnlockedInSequence(lessons, 'video-2'), false, 'quiz tugamaguncha keyingi video yopiq bo‘lishi kerak');

lessons[2].done = true;
assert.equal(flow.isLessonUnlockedInSequence(lessons, 'video-2'), true, 'quiz tugasa keyingi video ochilishi kerak');

console.log('course learning flow tests passed');
