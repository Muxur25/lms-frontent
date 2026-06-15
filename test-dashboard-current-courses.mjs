const API_BASE_URL = process.env.E2E_API_URL || 'http://localhost:3000/api/v1';
const CREDENTIAL = process.env.E2E_TAB || '1607';
const PASSWORD = process.env.E2E_PASSWORD || '12345678';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { response, data };
}

function unwrapAuthPayload(payload) {
  return payload?.data && typeof payload.data === 'object' ? payload.data : payload;
}

function unwrapList(payload) {
  const root = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
  if (Array.isArray(root)) return root;
  if (Array.isArray(root?.items)) return root.items;
  if (Array.isArray(root?.results)) return root.results;
  return [];
}

function clampProgress(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(100, Math.max(0, Math.round(numeric)));
}

function normalizeStatus(status, progress) {
  const normalized = String(status || '').toLowerCase().replace(/_/g, '-');
  if (['completed', 'complete', 'finished', 'done'].includes(normalized) || progress >= 100) {
    return 'completed';
  }
  return 'in-progress';
}

function normalizeEnrollment(item) {
  if (!item || typeof item !== 'object') return null;
  const rawCourse = item.course || item.courseData || item;
  if (!rawCourse || typeof rawCourse !== 'object') return null;

  const courseId = item.courseId || rawCourse.id || rawCourse._id;
  if (!courseId) return null;

  const progress = clampProgress(item.progress ?? item.completion ?? rawCourse.progress ?? rawCourse.completion);
  return {
    enrollmentId: String(item.enrollmentId || item.id || item._id || courseId),
    courseId: String(courseId),
    progress,
    status: normalizeStatus(item.status, progress),
    enrolledAt: String(item.enrolledAt || item.createdAt || ''),
    course: {
      id: String(courseId),
      title: String(rawCourse.title || ''),
      titleRu: typeof rawCourse.titleRu === 'string' ? rawCourse.titleRu : undefined,
      cat: typeof rawCourse.cat === 'string' ? rawCourse.cat : typeof rawCourse.category === 'string' ? rawCourse.category : undefined,
      catRu: typeof rawCourse.catRu === 'string' ? rawCourse.catRu : typeof rawCourse.categoryRu === 'string' ? rawCourse.categoryRu : undefined,
      color: typeof rawCourse.color === 'string' ? rawCourse.color : undefined,
      instructor: typeof rawCourse.instructor === 'string' ? rawCourse.instructor : undefined,
      lessons: Number.isFinite(Number(rawCourse.lessons)) ? Number(rawCourse.lessons) : undefined,
      duration: typeof rawCourse.duration === 'string' ? rawCourse.duration : undefined,
    },
  };
}

function sortCurrentEnrollments(enrollments) {
  return [...enrollments].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'in-progress' ? -1 : 1;
    const aTime = Date.parse(a.enrolledAt || '');
    const bTime = Date.parse(b.enrolledAt || '');
    return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
  });
}

async function login() {
  let result = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ credential: CREDENTIAL, password: PASSWORD }),
  });
  assert(result.response.ok, `Login failed with HTTP ${result.response.status}`);

  let auth = unwrapAuthPayload(result.data);
  if (auth?.maxDevicesReached) {
    const removeSessionId = auth.devices?.[0]?.sessionId;
    assert(removeSessionId, 'Device limit reached, but no removable sessionId returned');
    result = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ credential: CREDENTIAL, password: PASSWORD, removeSessionId }),
    });
    assert(result.response.ok, `Login retry failed with HTTP ${result.response.status}`);
    auth = unwrapAuthPayload(result.data);
  }

  assert(auth?.accessToken, 'Login did not return accessToken');
  assert(auth?.refreshToken, 'Login did not return refreshToken');
  assert(auth?.user?.id, 'Login did not return user');
  return auth;
}

async function run() {
  console.log(`API: ${API_BASE_URL}`);
  console.log(`User tab: ${CREDENTIAL}`);

  const auth = await login();
  console.log(`Login OK: ${auth.user.employeeId || auth.user.username || auth.user.id}`);

  const enrollmentsResult = await request('/courses/my-enrollments', {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
  });
  assert(enrollmentsResult.response.ok, `/courses/my-enrollments failed with HTTP ${enrollmentsResult.response.status}`);

  const normalized = unwrapList(enrollmentsResult.data)
    .map(normalizeEnrollment)
    .filter(Boolean);

  const dashboardCourses = sortCurrentEnrollments(normalized).slice(0, 3).map((enrollment) => ({
    id: enrollment.course?.id || enrollment.courseId,
    enrollmentId: enrollment.enrollmentId,
    title: enrollment.course?.title || '',
    progress: enrollment.progress,
    status: enrollment.status,
  }));

  for (const course of dashboardCourses) {
    assert(course.id, 'Dashboard course has no id');
    assert(course.enrollmentId, 'Dashboard course has no enrollmentId');
    assert(course.progress >= 0 && course.progress <= 100, `Invalid progress: ${course.progress}`);
    assert(['in-progress', 'completed'].includes(course.status), `Invalid status: ${course.status}`);
  }

  console.log(`Enrollments: ${normalized.length}`);
  console.log(`Dashboard cards expected: ${dashboardCourses.length}`);
  if (dashboardCourses.length === 0) {
    console.log('Expected UI state: empty block "Joriy kurslar topilmadi"');
  } else {
    console.table(dashboardCourses);
  }
  console.log('Dashboard current courses e2e OK');
}

run().catch((error) => {
  console.error('Dashboard current courses e2e FAILED');
  console.error(error);
  process.exit(1);
});

