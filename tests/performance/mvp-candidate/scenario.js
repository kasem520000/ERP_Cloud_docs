// k6 MVP candidate — 20 tenants, business-hours, 60/25/15 mix — NFR-006 budgets
import http from 'k6/http'; import { check } from 'k6';
export const options = {
  stages: [{duration:'5m', target:20}],
  thresholds: {
    'http_req_duration{name:document_list}': ['p(95)<500'],
    'http_req_duration{name:invoice_post}': ['p(95)<300'],
    'http_req_duration{name:report}': ['p(95)<1000'],
    'http_req_duration{name:login_shell}': ['p(95)<1500'],
    'http_req_failed': ['rate<0.001'],
  }
};
export default function(){
  const r1=http.get('https://staging.erp.local/api/v1/sales/invoices?limit=20', {tags:{name:'document_list'}});
  check(r1, {'T-01 <500': (r)=> r.timings.duration<500});
  const r2=http.post('https://staging.erp.local/api/v1/sales/invoices', JSON.stringify({customerId:'c1', lines:[{itemId:'i1', qty:'1', unitPrice:'10'}]}), {tags:{name:'invoice_post'}});
  check(r2, {'T-02 <300': (r)=> r.timings.duration<300});
}
