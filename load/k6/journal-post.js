import http from 'k6/http';
import { check, sleep } from 'k6';
export const options = { vus: 10, duration: '30s', thresholds: { http_req_duration: ['p(95)<300'], http_req_failed: ['rate<0.01'] } };
const BASE = __ENV.BASE_URL || 'http://localhost:3001';
export default function () {
  const res = http.get(`${BASE}/api/v1/accounting/gl/journal-register?tenantId=test&from=2026-01-01&to=2026-12-31`);
  check(res, { '200': r => r.status === 200 });
  sleep(1);
}
