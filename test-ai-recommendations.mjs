const API_BASE_URL = process.env.E2E_API_URL || 'http://localhost:3000/api/v1';
const CREDENTIAL = process.env.E2E_TAB || '1607';
const PASSWORD = process.env.E2E_PASSWORD || '12345678';

function assert(condition, message) {
  if (!condition) throw new Error(message);
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

async function login() {
  let result = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ credential: CREDENTIAL, password: PASSWORD }),
  });
  assert(result.response.ok, `Login failed: ${result.response.status}`);

  let auth = unwrap(result.data);
  if (auth?.maxDevicesReached) {
    const removeSessionId = auth.devices?.[0]?.sessionId;
    assert(removeSessionId, 'Device limit reached without removable session');
    result = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ credential: CREDENTIAL, password: PASSWORD, removeSessionId }),
    });
    assert(result.response.ok, `Login retry failed: ${result.response.status}`);
    auth = unwrap(result.data);
  }

  assert(auth?.accessToken, 'Missing access token');
  return auth;
}

function validateRecommendations(payload, language) {
  const data = unwrap(payload);
  assert(data.language === language, `Expected language ${language}, got ${data.language}`);
  assert(['ai', 'fallback'].includes(data.source), `Invalid source: ${data.source}`);
  assert(Array.isArray(data.recommendations), 'recommendations must be an array');
  assert(data.recommendations.length >= 1, 'recommendations should not be empty');
  assert(data.recommendations.length <= 3, 'recommendations must be max 3');

  for (const item of data.recommendations) {
    assert(typeof item.title === 'string' && item.title.trim(), 'recommendation title is required');
    assert(typeof item.reason === 'string' && item.reason.trim(), 'recommendation reason is required');
    assert(/^#[0-9a-f]{6}$/i.test(item.color), `invalid color: ${item.color}`);
    assert(Number.isInteger(item.match) && item.match >= 0 && item.match <= 100, `invalid match: ${item.match}`);
  }

  return data;
}

async function run() {
  console.log(`API: ${API_BASE_URL}`);
  const auth = await login();
  console.log(`Login OK: ${auth.user?.employeeId || auth.user?.id}`);

  for (const language of ['uz', 'ru']) {
    const headers = { Authorization: `Bearer ${auth.accessToken}`, 'Accept-Language': language };
    const recs = await request(`/ai/recommendations?language=${language}`, { headers });
    assert(recs.response.ok, `recommendations ${language} failed: ${recs.response.status}`);
    const data = validateRecommendations(recs.data, language);
    console.log(`${language} recommendations: ${data.recommendations.length}, source: ${data.source}`);

    const history = await request(`/ai/recommendations/history?language=${language}`, { headers });
    assert(history.response.ok, `history ${language} failed: ${history.response.status}`);
    const historyData = unwrap(history.data);
    assert(Array.isArray(historyData.recommendations), 'history recommendations must be an array');
    assert(historyData.recommendations.length >= data.recommendations.length, 'history should include today recommendations');
    console.log(`${language} history: ${historyData.recommendations.length}`);
  }

  console.log('AI recommendations e2e OK');
}

run().catch((error) => {
  console.error('AI recommendations e2e FAILED');
  console.error(error);
  process.exit(1);
});

