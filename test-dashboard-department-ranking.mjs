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
  return auth;
}

async function run() {
  console.log(`API: ${API_BASE_URL}`);
  console.log(`User tab: ${CREDENTIAL}`);

  const optionsResult = await request('/auth/mof3-registration-options');
  assert(optionsResult.response.ok, `/auth/mof3-registration-options failed with HTTP ${optionsResult.response.status}`);
  const options = unwrap(optionsResult.data);
  assert(Array.isArray(options?.departments), 'registration departments must be an array');
  const canonicalDepartments = options.departments.filter((department) => department.id && department.organizationCode);
  assert(canonicalDepartments.length === options.departments.length, 'all registration departments must have id and organizationCode');

  const auth = await login();
  console.log(`Login OK: ${auth.user?.employeeId || auth.user?.id}`);

  const analyticsResult = await request('/analytics/executive', {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
  });
  assert(analyticsResult.response.ok, `/analytics/executive failed with HTTP ${analyticsResult.response.status}`);
  const analytics = unwrap(analyticsResult.data);
  const ranking = analytics?.rankings?.departments;
  assert(Array.isArray(ranking), 'rankings.departments must be an array');

  for (const row of ranking) {
    assert(row.departmentId, `department ranking row has no departmentId: ${JSON.stringify(row)}`);
    assert(row.organizationCode, `department ranking row has no organizationCode: ${JSON.stringify(row)}`);
    assert(typeof row.name === 'string' && row.name.trim(), 'department ranking row has no name');
    assert(Number.isFinite(Number(row.averageScore)), `invalid averageScore for ${row.name}`);
    assert(Number.isFinite(Number(row.attempts)), `invalid attempts for ${row.name}`);
    assert(Number.isFinite(Number(row.passRate)), `invalid passRate for ${row.name}`);
    assert(Number.isFinite(Number(row.participants)), `invalid participants for ${row.name}`);
  }

  const rankingKeys = new Set(ranking.map((row) => `${row.organizationCode}:${row.name}`));
  const missingFromRanking = canonicalDepartments
    .map((department) => `${department.organizationCode}:${department.name}`)
    .filter((key) => !rankingKeys.has(key));
  assert(missingFromRanking.length === 0, `canonical departments missing from ranking: ${missingFromRanking.join(', ')}`);

  console.log(`Canonical departments: ${canonicalDepartments.length}`);
  console.log(`Ranking rows: ${ranking.length}`);
  console.log('Dashboard department ranking e2e OK');
}

run().catch((error) => {
  console.error('Dashboard department ranking e2e FAILED');
  console.error(error);
  process.exit(1);
});
