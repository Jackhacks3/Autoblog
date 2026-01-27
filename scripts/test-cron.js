#!/usr/bin/env node
/**
 * Test cron endpoint with CRON_SECRET.
 * Usage: CRON_SECRET=cron_secret node scripts/test-cron.js [baseUrl]
 * Default: http://localhost:3000
 */

const secret = process.env.CRON_SECRET || 'cron_secret';
const base = (process.argv[2] || process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const url = `${base}/api/cron/daily-post`;

async function main() {
  console.log('Testing cron endpoint');
  console.log('  URL:', url);
  console.log('  Authorization: Bearer', secret ? secret.substring(0, 12) + '...' : '(none)');
  console.log('');

  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${secret}` },
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  console.log('Response:', res.status, res.statusText);
  console.log('Body:', typeof body === 'object' ? JSON.stringify(body, null, 2) : body);

  if (res.status === 401) {
    console.log('\n-> Auth failed (wrong or missing CRON_SECRET)');
    process.exit(1);
  }
  if (res.status === 404) {
    console.log('\n-> Route not found (check base URL / deployment)');
    process.exit(1);
  }
  if (res.ok) {
    console.log('\n-> Cron auth OK. Pipeline success:', !!body?.success);
    process.exit(body?.success ? 0 : 1);
  }
  console.log('\n-> Cron error');
  process.exit(1);
}

main().catch((e) => {
  console.error('Request failed:', e.message);
  process.exit(1);
});
