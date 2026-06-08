import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '10s', target: 10 },   // ramp up: 10 usuários
    { duration: '20s', target: 50 },   // ramp up: 50 usuários
    { duration: '20s', target: 50 },   // steady: 50 usuários
    { duration: '10s', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% das reqs < 500ms
    http_req_failed: ['rate<0.01'],    // < 1% de falhas
  },
}

const BASE_URL = 'http://localhost:3333'

export default function () {
  // ── Health Check ──────────────────────────────────────
  const health = http.get(`${BASE_URL}/health`)
  check(health, {
    'health: status 200': (r) => r.status === 200,
    'health: body ok': (r) => r.json('status') === 'ok',
  })

  // ── Login attempt ─────────────────────────────────────
  const login = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: 'admin@escola.com',
    password: '123456',
  }), {
    headers: { 'Content-Type': 'application/json' },
  })

  check(login, {
    'login: responde (200 ou 401)': (r) => r.status === 200 || r.status === 401,
  })

  // ── Public endpoint ───────────────────────────────────
  const refresh = http.post(`${BASE_URL}/api/auth/refresh`, JSON.stringify({
    refreshToken: 'test',
  }), {
    headers: { 'Content-Type': 'application/json' },
  })

  check(refresh, {
    'refresh: responde': (r) => r.status === 401 || r.status === 400,
  })

  sleep(1)
}

export function handleSummary(data) {
  return {
    'k6-summary.json': JSON.stringify(data),
    stdout: `
═══════════════════════════════════════
  K6 LOAD TEST RESULTS
═══════════════════════════════════════
Total Requests:    ${data.metrics.http_reqs.values.count}
Failed:            ${data.metrics.http_req_failed.values.rate * 100}%
Avg Duration:      ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
P95 Duration:      ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
P99 Duration:      ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms
Peak VUs:          ${data.metrics.vus_max.values.max}
`,
  }
}
