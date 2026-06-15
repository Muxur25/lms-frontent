const API_BASE_URL = process.env.E2E_API_URL || 'http://localhost:3000/api/v1';
const CREDENTIAL = process.env.E2E_TAB || '1607';
const PASSWORD = process.env.E2E_PASSWORD || '87654321';
const FILTERS = ['all_time', 'month', 'week', 'today'];

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

function validateDepartmentRows(rows, filter) {
  assert(Array.isArray(rows), `${filter}: department leaderboard must be an array`);
  assert(rows.length > 0, `${filter}: department leaderboard must not be empty`);
  for (const row of rows) {
    assert(row.departmentId, `${filter}: department row has no departmentId: ${JSON.stringify(row)}`);
    assert(row.organizationCode, `${filter}: department row has no organizationCode: ${JSON.stringify(row)}`);
    assert(typeof row.departmentName === 'string' && row.departmentName.trim(), `${filter}: department row has no departmentName`);
    assert(Number.isFinite(Number(row.rank)), `${filter}: invalid rank for ${row.departmentName}`);
    assert(Number.isFinite(Number(row.participants)), `${filter}: invalid participants for ${row.departmentName}`);
    assert(Number.isFinite(Number(row.points)), `${filter}: invalid points for ${row.departmentName}`);
  }
}

async function run() {
  console.log(`API: ${API_BASE_URL}`);
  console.log(`User tab: ${CREDENTIAL}`);

  const auth = await login();
  console.log(`Login OK: ${auth.user?.employeeId || auth.user?.id}`);

  const meResult = await request('/leaderboard/me', {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
  });
  assert(meResult.response.ok, `/leaderboard/me failed with HTTP ${meResult.response.status}`);
  const me = unwrap(meResult.data);
  assert(me.userId, '/leaderboard/me did not return userId');
  assert(Number.isFinite(Number(me.totalPoints)), '/leaderboard/me returned invalid totalPoints');
  if (me.departmentId) {
    assert(me.organizationCode, '/leaderboard/me returned departmentId without organizationCode');
    assert(typeof me.departmentName === 'string' && me.departmentName.trim(), '/leaderboard/me returned departmentId without departmentName');
  }

  for (const filter of FILTERS) {
    const globalResult = await request(`/leaderboard/global?timeFilter=${filter}`, {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    });
    assert(globalResult.response.ok, `${filter}: /leaderboard/global failed with HTTP ${globalResult.response.status}`);
    const globalRows = unwrap(globalResult.data);
    assert(Array.isArray(globalRows), `${filter}: global leaderboard must be an array`);
    for (const row of globalRows) {
      assert(Number.isFinite(Number(row.totalPoints)), `${filter}: invalid totalPoints for global row`);
      assert(Number.isFinite(Number(row.periodPoints)), `${filter}: invalid periodPoints for global row`);
    }

    const departmentResult = await request(`/leaderboard/departments?timeFilter=${filter}`, {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    });
    assert(departmentResult.response.ok, `${filter}: /leaderboard/departments failed with HTTP ${departmentResult.response.status}`);
    const departmentRows = unwrap(departmentResult.data);
    validateDepartmentRows(departmentRows, filter);
    console.log(`${filter}: global=${globalRows.length}, departments=${departmentRows.length}`);
  }

  console.log('Leaderboard e2e OK');
}

run().catch((error) => {
  console.error('Leaderboard e2e FAILED');
  console.error(error);
  process.exit(1);
});
