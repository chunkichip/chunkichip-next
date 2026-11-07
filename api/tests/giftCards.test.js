const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const crypto = require('crypto');
const gifts = require('../giftCards');
const realFetch = global.fetch;
let server, base, state, calls, router, failMail = false;
const good = { amount: 2000, designId: 'birthday', recipientName: 'Cookie Fan', recipientEmail: 'recipient@example.com', buyerName: 'Gift Giver', buyerEmail: 'buyer@example.com', message: '<script>bad</script>' };
function response(value, status = 200) { return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } }); }
before(async () => {
  Object.assign(process.env, { GIFT_CARD_SALES_ENABLED: 'true', SQUARE_APPLICATION_ID: 'test-app', SQUARE_ACCESS_TOKEN: 'private-square', SQUARE_LOCATION_ID: 'location', NEXT_PUBLIC_SUPABASE_URL: 'https://gift-db.invalid', SUPABASE_SERVICE_ROLE_KEY: 'private-db', RESEND_API_KEY: 'private-mail', GIFT_CARD_EMAIL_FROM: 'Chunki Chip <gift@example.com>' });
  global.fetch = async (url, options = {}) => {
    url = String(url);
    if (url.startsWith(base)) return realFetch(url, options);
    const body = options.body ? JSON.parse(options.body) : null;
    if (url.startsWith('https://gift-db.invalid')) {
      const params = new URL(url).searchParams;
      const id = params.get('id')?.slice(3);
      let rows = [...state.values()].filter(row => (!id || row.id === id) && (!params.get('token_hash') || row.token_hash === params.get('token_hash').slice(3)));
      if (options.method === 'POST') {
        if (state.has(body.id)) return response({}, 409);
        const row = { ...body, status: 'pending', attempts: 0, lease_until: '1970-01-01', created_at: new Date().toISOString() }; state.set(row.id, row); return response([row]);
      }
      if (options.method === 'PATCH') {
        rows = rows.filter(row => (!params.get('lease') || row.lease === params.get('lease').slice(3)) && (!params.get('lease_until') || Date.parse(row.lease_until) < Date.now()) && (!params.get('status') || !['sent','payment_failed','attention'].includes(row.status)));
        rows.forEach(row => Object.assign(row, body));
      }
      return response(rows);
    }
    calls.push({ url, body });
    if (url.endsWith('/v2/orders') && body) return response({ order: { id: `square-${body.order.reference_id}` } });
    if (/\/v2\/orders\//.test(url)) {
      const id = url.split('square-')[1]; const row = state.get(id);
      return response({ order: { id: row.square_order_id, state: row.payment_id ? 'COMPLETED' : 'OPEN', total_money: { amount: row.amount, currency: 'USD' }, tenders: row.payment_id ? [{ payment_id: row.payment_id }] : [] } });
    }
    if (url.endsWith('/v2/payments') && body) {
      assert.ok(body.idempotency_key.length <= 45, 'Square payment keys must fit its 45-character limit');
      if (body.source_id === 'declined') return response({ errors: [{ code: 'CARD_DECLINED' }] }, 400);
      return response({ payment: { id: `pay-${body.reference_id}`, status: 'COMPLETED', receipt_url: 'https://squareup.com/receipt/test' } });
    }
    if (/\/v2\/payments\//.test(url)) {
      const id = url.split('pay-')[1]; const row = state.get(id);
      return response({ payment: { id: row.payment_id, order_id: row.square_order_id, location_id: row.location_id, status: 'COMPLETED', amount_money: { amount: row.amount, currency: 'USD' } } });
    }
    if (url.endsWith('/v2/gift-cards') && body) return response({ gift_card: { id: `gftc:${body.idempotency_key}` } });
    if (url.endsWith('/v2/gift-cards/activities')) return response({ gift_card_activity: { id: 'activation' } });
    if (/\/v2\/gift-cards\//.test(url)) return response({ gift_card: { state: 'ACTIVE', gan: '7783000000001234' } });
    if (url === 'https://api.resend.com/emails') return failMail ? response({}, 503) : response({ id: 'email-id' });
    throw new Error('Unexpected external call');
  };
  const app = express(); app.use(express.json()); router = gifts(); app.use('/api/gift-cards', router);
  server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve)); base = `http://127.0.0.1:${server.address().port}`;
});
after(() => { global.fetch = realFetch; server.close(); });
async function request(path, body, token, extra = {}) {
  const result = await realFetch(`${base}/api/gift-cards${path}`, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', ...(token ? { 'x-gift-order-token': token } : {}), ...extra }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: result.status, data: await result.json() };
}
function reset() { process.env.GIFT_CARD_SALES_ENABLED = 'true'; delete process.env.GIFT_CARD_TEST_EMAIL; state = new Map(); calls = []; failMail = false; return { id: crypto.randomUUID(), token: crypto.randomBytes(32).toString('hex') }; }
test('validates price, design, emails and escapes the message', () => {
  for (const change of [{amount: 1}, {amount: 50001}, {amount: 500.5}, {designId:'fake'}, {recipientEmail:'invalid'}]) assert.throws(() => gifts.validateGift({ ...good, ...change }));
  const html = gifts.emailBody({ ...gifts.validateGift(good), id: 'order' }, '7783000000001234');
  assert.ok(!html.includes('<script>')); assert.ok(html.includes('&lt;script&gt;'));
});
test('blocks purchases when not configured and cross-origin requests', async () => {
  reset(); process.env.GIFT_CARD_SALES_ENABLED = 'false';
  const config = await request('/config'); assert.equal(config.data.available, false); assert.equal(config.data.applicationId, undefined);
  assert.equal((await request('/orders', good)).status, 403); process.env.GIFT_CARD_SALES_ENABLED = 'true';
  assert.equal((await request('/orders', good, null, { origin: 'https://evil.example' })).status, 403);
});
test('order ownership, changed details, and unpaid order safety', async () => {
  const access = reset(); assert.equal((await request('/orders', { ...good, ...access })).status, 200);
  assert.equal((await request(`/orders/${access.id}`, null, '0'.repeat(64))).status, 404);
  assert.equal((await request('/orders', { ...good, ...access, amount: 5000 })).status, 409);
  const result = await request(`/orders/${access.id}`, null, access.token); assert.equal(result.data.status, 'pending'); assert.equal(calls.length, 0);
  assert.ok(!JSON.stringify(result.data).includes('token_hash'));
});
test('successful payment activates once and emails selected design; retry does not recharge', async () => {
  const access = reset(); await request('/orders', { ...good, ...access });
  const path = `/orders/${access.id}/pay`;
  assert.equal((await request(path, { sourceId: 'card-token' }, access.token)).status, 200);
  const result = await request(`/orders/${access.id}`, null, access.token); assert.equal(result.data.status, 'sent');
  const firstPay = calls.findIndex(c => c.url.endsWith('/v2/payments'));
  const activation = calls.findIndex(c => c.url.endsWith('/activities')); assert.ok(activation > firstPay);
  const email = calls.find(c => c.url === 'https://api.resend.com/emails'); assert.deepEqual(email.body.to, [good.recipientEmail]); assert.ok(email.body.html.includes('rlaayna65'));
  assert.ok(!JSON.stringify(result.data).includes('7783000000001234'));
  await request(path, { sourceId: 'card-token' }, access.token);
  assert.equal(calls.filter(c => c.url.endsWith('/v2/payments')).length, 1);
  assert.equal(calls.filter(c => c.url.endsWith('/activities')).length, 1);
});
test('declined payment never creates, activates, or emails a gift card', async () => {
  const access = reset(); await request('/orders', { ...good, ...access });
  assert.equal((await request(`/orders/${access.id}/pay`, { sourceId: 'declined' }, access.token)).status, 400);
  assert.equal(calls.filter(c => c.url.includes('gift-cards') || c.url.includes('resend')).length, 0);
});

test('mail interruption preserves paid order and retry uses the same gift card', async () => {
  const access = reset(); await request('/orders', { ...good, ...access }); failMail = true;
  assert.equal((await request(`/orders/${access.id}/pay`, { sourceId: 'card-token' }, access.token)).status, 202);
  assert.equal(state.get(access.id).status, 'paid');
  const cardId = state.get(access.id).gift_card_id;
  failMail = false; await router.retryPendingGiftOrders();
  assert.equal(state.get(access.id).status, 'sent'); assert.equal(state.get(access.id).gift_card_id, cardId);
  assert.equal(calls.filter(c => c.url.endsWith('/v2/payments')).length, 1);
  assert.equal(calls.filter(c => c.url.endsWith('/v2/gift-cards')).length, 1);
  const activationKeys = calls.filter(c => c.url.endsWith('/activities')).map(c => c.body.idempotency_key);
  assert.equal(new Set(activationKeys).size, 1);
});
test('parallel pay clicks cannot charge twice', async () => {
  const access = reset(); await request('/orders', { ...good, ...access });
  const path = `/orders/${access.id}/pay`;
  await Promise.all([request(path, { sourceId: 'card-token' }, access.token), request(path, { sourceId: 'card-token' }, access.token)]);
  assert.equal(calls.filter(c => c.url.endsWith('/v2/payments')).length, 1);
});

test('new Supabase secret keys use apikey without a bearer JWT', async () => {
  reset(); process.env.SUPABASE_SECRET_KEY = 'sb_secret_test';
  const previous = global.fetch; let seen;
  global.fetch = async (url, options) => { if (String(url).startsWith('https://gift-db.invalid')) seen = options.headers; return previous(url, options); };
  try { assert.equal((await request('/config')).data.setupComplete, true); assert.equal(seen.apikey, 'sb_secret_test'); assert.equal(seen.Authorization, undefined); }
  finally { global.fetch = previous; delete process.env.SUPABASE_SECRET_KEY; }
});
test('test checkout is hidden publicly and restricted to the test sender and recipient', async () => {
  const access = reset(); process.env.GIFT_CARD_SALES_ENABLED = 'false'; process.env.GIFT_CARD_TEST_EMAIL = good.buyerEmail;
  try {
    assert.equal((await request('/config')).data.available, false);
    const config = (await request('/config?test=1')).data; assert.equal(config.available, true); assert.equal(config.testMode, true); assert.ok(!JSON.stringify(config).includes(good.buyerEmail));
    assert.equal((await request('/orders', { ...good, ...access })).status, 403);
    assert.equal((await request('/orders', { ...good, ...access, recipientEmail: good.buyerEmail })).status, 200);
  } finally { delete process.env.GIFT_CARD_TEST_EMAIL; process.env.GIFT_CARD_SALES_ENABLED = 'true'; }
});
