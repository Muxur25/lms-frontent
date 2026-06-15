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

function unwrap(payload) {
  return payload?.data && typeof payload.data === 'object' ? payload.data : payload;
}

function unwrapList(payload) {
  const root = unwrap(payload);
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

function expectedBreakdown(enrollments) {
  return enrollments.reduce((acc, item) => {
    const progress = clampProgress(item.progress ?? item.completion ?? item.course?.progress ?? item.courseData?.progress);
    const status = String(item.status || '').toLowerCase().replace(/_/g, '-');
    acc.total += 1;
    if (status === 'completed' || progress >= 100) {
      acc.completed += 1;
    } else if (progress > 0) {
      acc.inProgress += 1;
    } else {
      acc.notStarted += 1;
    }
    return acc;
  }, { total: 0, completed: 0, inProgress: 0, notStarted: 0 });
}

async function login() {
  let result = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ credential: CREDENTIAL, password: PASSWORD }),
  });
  assert(result.response.ok, `Login failed with HTTP ${result.response.status}`);

  let auth = unwrap(result.data);
  if (auth?.maxDevicesReached) {
    const removeSessionId = auth.devices?.[0]?.sessionId;
    assert(removeSessionId, 'Device limit reached, but no removable sessionId returned');
    result = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ credential: CREDENTIAL, password: PASSWORD, removeSessionId }),
    });
    assert(result.response.ok, `Login retry failed with HTTP ${result.response.status}`);
    auth = unwrap(result.data);
  }

  assert(auth?.accessToken, 'Login did not return accessToken');
  assert(auth?.user?.id, 'Login did not return user');
  return auth;
}

async function run() {
  console.log(`API: ${API_BASE_URL}`);
  console.log(`User tab: ${CREDENTIAL}`);

  const auth = await login();
  console.log(`Login OK: ${auth.user.employeeId || auth.user.username || auth.user.id}`);
  const headers = { Authorization: `Bearer ${auth.accessToken}` };

  const [analyticsResult, enrollmentsResult] = await Promise.all([
    request('/analytics/executive', { headers }),
    request('/courses/my-enrollments', { headers }),
  ]);

  assert(analyticsResult.response.ok, `/analytics/executive failed with HTTP ${analyticsResult.response.status}`);
  assert(enrollmentsResult.response.ok, `/courses/my-enrollments failed with HTTP ${enrollmentsResult.response.status}`);

  const analytics = unwrap(analyticsResult.data);
  const enrollments = unwrapList(enrollmentsResult.data);
  const expected = expectedBreakdown(enrollments);
  const actual = analytics?.learning?.statusBreakdown;

  assert(actual && typeof actual === 'object', 'learning.statusBreakdown is required');
  for (const key of ['total', 'completed', 'inProgress', 'notStarted']) {
    assert(Number(actual[key]) === expected[key], `statusBreakdown.${key}: expected ${expected[key]}, got ${actual[key]}`);
  }
  assert(Number(analytics.learning.enrollments) === expected.total, `learning.enrollments mismatch: ${analytics.learning.enrollments}`);
  assert(Number(analytics.learning.completions) === expected.completed, `learning.completions mismatch: ${analytics.learning.completions}`);

  console.log('Expected breakdown:', expected);
  console.log('API breakdown:', actual);
  if (expected.total === 0) {
    console.log("Expected UI state: empty block \"Kurs holati bo'yicha ma'lumot yo'q\"");
  }
  console.log('Dashboard course status e2e OK');
}

run().catch((error) => {
  console.error('Dashboard course status e2e FAILED');
  console.error(error);
  process.exit(1);
});
