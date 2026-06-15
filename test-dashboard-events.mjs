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

function unwrapPayload(payload) {
  return payload?.data && typeof payload.data === 'object' ? payload.data : payload;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function eventLink(type) {
  return {
    exam: '/assessments',
    webinar: '/webinars',
    certificate: '/certifications',
  }[type];
}

function normalizeDashboardEvent(event) {
  if (!event || typeof event !== 'object') return null;
  if (!event.id || !event.startsAt) return null;
  if (!['upcoming', 'live', 'expiring'].includes(event.status)) return null;

  const link = eventLink(event.type);
  if (!link) return null;

  const startsAtMs = Date.parse(event.startsAt);
  if (!Number.isFinite(startsAtMs)) return null;

  return {
    id: String(event.id),
    title: String(event.title || ''),
    type: event.type,
    status: event.status,
    link,
    location: event.location || 'LMS',
    startsAtMs,
  };
}

async function login() {
  let result = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ credential: CREDENTIAL, password: PASSWORD }),
  });
  assert(result.response.ok, `Login failed with HTTP ${result.response.status}`);

  let auth = unwrapPayload(result.data);
  if (auth?.maxDevicesReached) {
    const removeSessionId = auth.devices?.[0]?.sessionId;
    assert(removeSessionId, 'Device limit reached, but no removable sessionId returned');
    result = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ credential: CREDENTIAL, password: PASSWORD, removeSessionId }),
    });
    assert(result.response.ok, `Login retry failed with HTTP ${result.response.status}`);
    auth = unwrapPayload(result.data);
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

  const from = new Date();
  const to = new Date(from);
  to.setDate(to.getDate() + 14);

  const scheduleResult = await request(`/schedule?from=${toDateKey(from)}&to=${toDateKey(to)}`, {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
  });
  assert(scheduleResult.response.ok, `/schedule failed with HTTP ${scheduleResult.response.status}`);

  const schedule = unwrapPayload(scheduleResult.data);
  assert(Array.isArray(schedule?.events), '/schedule did not return events array');

  const dashboardEvents = schedule.events
    .map(normalizeDashboardEvent)
    .filter(Boolean)
    .sort((a, b) => a.startsAtMs - b.startsAtMs)
    .slice(0, 4);

  for (const event of dashboardEvents) {
    assert(event.title, `Event ${event.id} has no title`);
    assert(['exam', 'webinar', 'certificate'].includes(event.type), `Invalid event type: ${event.type}`);
    assert(['upcoming', 'live', 'expiring'].includes(event.status), `Invalid dashboard status: ${event.status}`);
    assert(event.link === eventLink(event.type), `Invalid link for ${event.type}: ${event.link}`);
    assert(event.location, `Event ${event.id} has no location fallback`);
  }

  console.log(`Schedule events: ${schedule.events.length}`);
  console.log(`Dashboard event cards expected: ${dashboardEvents.length}`);
  if (dashboardEvents.length === 0) {
    console.log('Expected UI state: empty block "Yaqin kunlarga voqealar topilmadi"');
  } else {
    console.table(dashboardEvents.map(({ id, title, type, status, link }) => ({ id, title, type, status, link })));
  }
  console.log('Dashboard upcoming events e2e OK');
}

run().catch((error) => {
  console.error('Dashboard upcoming events e2e FAILED');
  console.error(error);
  process.exit(1);
});
