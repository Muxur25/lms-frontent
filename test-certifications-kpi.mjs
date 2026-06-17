const API_BASE_URL = process.env.E2E_API_URL || 'http://localhost:3000/api/v1';
const CREDENTIAL = process.env.E2E_TAB || '1607';
const PASSWORD = process.env.E2E_PASSWORD || '87654321';
const EXPIRING_WINDOW_MS = 30 * 86400000;
const ORG_KPI_ROLES = new Set(['super_admin', 'admin', 'hr_manager', 'trainer', 'executive']);

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

function unwrapList(payload) {
  const root = unwrap(payload);
  if (Array.isArray(root)) return root;
  if (Array.isArray(root?.items)) return root.items;
  if (Array.isArray(root?.results)) return root.results;
  return [];
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

function isExpiredByDate(cert, now = Date.now()) {
  if (!cert?.expiresAt) return false;
  const expiresAt = Date.parse(cert.expiresAt);
  return Number.isFinite(expiresAt) && expiresAt <= now;
}

function isExpiringByDate(cert, now = Date.now()) {
  if (!cert?.expiresAt || cert.status === 'revoked') return false;
  const expiresAt = Date.parse(cert.expiresAt);
  if (!Number.isFinite(expiresAt)) return false;
  const diff = expiresAt - now;
  return diff > 0 && diff <= EXPIRING_WINDOW_MS;
}

function isActiveByDate(cert, now = Date.now()) {
  return cert.status !== 'revoked' && !isExpiredByDate(cert, now) && !isExpiringByDate(cert, now);
}

function isValidForScore(cert, now = Date.now()) {
  return cert.status !== 'revoked' && !isExpiredByDate(cert, now);
}

function calculateKpis(certs) {
  const now = Date.now();
  const validForScore = certs.filter((cert) => isValidForScore(cert, now));
  return {
    total: certs.length,
    active: certs.filter((cert) => isActiveByDate(cert, now)).length,
    expiring: certs.filter((cert) => isExpiringByDate(cert, now)).length,
    avgScore: validForScore.length
      ? Math.round(validForScore.reduce((sum, cert) => sum + Number(cert.score || 0), 0) / validForScore.length)
      : 0,
  };
}

function calculateExpirationBuckets(certs) {
  const now = Date.now();
  return {
    expiring: certs.filter((cert) => isExpiringByDate(cert, now)).length,
    expired: certs.filter((cert) => cert.status !== 'revoked' && (cert.status === 'expired' || isExpiredByDate(cert, now))).length,
  };
}

function validateCertificate(cert) {
  assert(cert.id, `Certificate has no id: ${JSON.stringify(cert)}`);
  assert(cert.certificateId, `Certificate has no certificateId: ${JSON.stringify(cert)}`);
  assert(Number.isFinite(Number(cert.score)), `Certificate has invalid score: ${JSON.stringify(cert)}`);
  assert(['active', 'expiring_soon', 'expired', 'revoked'].includes(cert.status), `Invalid certificate status: ${cert.status}`);
}

function validateAnalytics(analytics) {
  assert(analytics && typeof analytics === 'object', 'Analytics response must be an object');
  assert(analytics.totals && typeof analytics.totals === 'object', 'Analytics has no totals object');
  for (const key of ['total', 'active', 'expiring', 'expired', 'revoked']) {
    assert(Number.isFinite(Number(analytics.totals[key])), `Analytics totals.${key} is invalid`);
    assert(Number(analytics.totals[key]) >= 0, `Analytics totals.${key} must not be negative`);
  }
  assert(Number.isFinite(Number(analytics.avgScore)), 'Analytics avgScore is invalid');
  assert(Number(analytics.avgScore) >= 0 && Number(analytics.avgScore) <= 100, 'Analytics avgScore must be between 0 and 100');
  assert(Array.isArray(analytics.byDepartment), 'Analytics byDepartment must be an array');
  assert(Array.isArray(analytics.byCategory), 'Analytics byCategory must be an array');
  assert(Array.isArray(analytics.monthlyTrend), 'Analytics monthlyTrend must be an array');
  assert(Array.isArray(analytics.soonExpiring), 'Analytics soonExpiring must be an array');
  for (const row of analytics.monthlyTrend) {
    assert(typeof row.month === 'string' && row.month.trim(), 'Analytics monthlyTrend row has invalid month');
    assert(Number.isFinite(Number(row.count)) && Number(row.count) >= 0, 'Analytics monthlyTrend row has invalid count');
  }
  for (const row of [...analytics.byDepartment, ...analytics.byCategory]) {
    assert(typeof row.name === 'string' && row.name.trim(), 'Analytics grouping row has invalid name');
    assert(Number.isFinite(Number(row.count)) && Number(row.count) >= 0, 'Analytics grouping row has invalid count');
  }
}

async function run() {
  console.log(`API: ${API_BASE_URL}`);
  console.log(`User tab: ${CREDENTIAL}`);

  const auth = await login();
  const role = auth.user?.role || '';
  console.log(`Login OK: ${auth.user.employeeId || auth.user.username || auth.user.id} (${role || 'no-role'})`);

  const headers = { Authorization: `Bearer ${auth.accessToken}` };
  const myResult = await request('/certificates/my', { headers });
  assert(myResult.response.ok, `/certificates/my failed with HTTP ${myResult.response.status}`);
  const myCerts = unwrapList(myResult.data);
  myCerts.forEach(validateCertificate);

  const missingVerifyResult = await request('/certificates/verify/AGMK-DOES-NOT-EXIST-000000', { headers });
  assert(missingVerifyResult.response.ok, `/certificates/verify missing certificate failed with HTTP ${missingVerifyResult.response.status}`);
  const missingVerify = unwrap(missingVerifyResult.data);
  assert(missingVerify?.valid === false, 'Missing certificate verification must return valid=false');
  assert(missingVerify?.status === 'invalid', `Missing certificate verification status must be invalid, got ${missingVerify?.status}`);

  if (myCerts.length > 0) {
    const cert = myCerts[0];
    const verifyResult = await request(`/certificates/verify/${encodeURIComponent(cert.certificateId)}`, { headers });
    assert(verifyResult.response.ok, `/certificates/verify existing certificate failed with HTTP ${verifyResult.response.status}`);
    const verified = unwrap(verifyResult.data);
    assert(verified?.certificate?.certificateId === cert.certificateId, 'Verified certificate id does not match');
    assert(['valid', 'expired', 'revoked'].includes(verified.status), `Unexpected verify status: ${verified.status}`);
  }

  const expectedPersonal = calculateKpis(myCerts);
  const expirationBuckets = calculateExpirationBuckets(myCerts);
  assert(expectedPersonal.active + expectedPersonal.expiring <= expectedPersonal.total, 'Personal KPI counts exceed total');
  assert(expirationBuckets.expiring >= 0 && expirationBuckets.expired >= 0, 'Expiration buckets must not be negative');

  const analyticsResult = await request('/certificates/analytics', { headers });
  assert(analyticsResult.response.ok, `/certificates/analytics failed with HTTP ${analyticsResult.response.status}`);
  const analytics = unwrap(analyticsResult.data);
  validateAnalytics(analytics);

  const invalidTrackResult = await request('/certificates/not-a-real-id/track', {
    method: 'POST',
    headers,
    body: JSON.stringify({ action: 'invalid_action' }),
  });
  assert(invalidTrackResult.response.status === 400, `Invalid track action should return 400, got ${invalidTrackResult.response.status}`);

  if (!ORG_KPI_ROLES.has(role)) {
    assert(Number(analytics.totals.total) === expectedPersonal.total, 'Employee analytics total does not match /certificates/my');
    assert(Number(analytics.totals.active) === expectedPersonal.active, 'Employee analytics active does not match date-based personal KPI');
    assert(Number(analytics.totals.expiring) === expectedPersonal.expiring, 'Employee analytics expiring does not match date-based personal KPI');
    assert(Number(analytics.avgScore) === expectedPersonal.avgScore, 'Employee analytics avgScore does not match personal KPI');
  }

  console.log('Personal KPI expected:', expectedPersonal);
  console.log('Expiration buckets:', expirationBuckets);
  console.log('Analytics totals:', analytics.totals, `avgScore=${analytics.avgScore}`);
  console.log('Certifications KPI e2e OK');
}

run().catch((error) => {
  console.error('Certifications KPI e2e FAILED');
  console.error(error);
  process.exit(1);
});
