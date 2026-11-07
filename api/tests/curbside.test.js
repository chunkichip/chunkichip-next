const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
process.env.SQUARE_ACCESS_TOKEN = 'curbside-test-secret';
process.env.SQUARE_ENV = 'sandbox';
const factory = require('../curbside');
let server; let base; let paid; let arrived; let updates; let collected; let canceled; let wrongLocation; let conflict;
const realFetch = global.fetch;
const token = factory.createToken('order-1', 'location-1');
function reset() { paid = true; arrived = false; updates = 0; collected = false; canceled = false; wrongLocation = false; conflict = false; }
before(async () => {
 global.fetch = async (input, options = {}) => {
  const url = String(input);
  if (!url.startsWith('https://connect.squareupsandbox.com')) return realFetch(input, options);
  const body = options.body ? JSON.parse(options.body) : null;
  if (options.method === 'PUT') {
   updates++;
   assert.equal(body.order.fulfillments[0].uid, 'curbside');
   assert.equal(body.order.fulfillments[0].pickup_details.curbside_pickup_details.curbside_details, 'White Honda');
   assert.equal(body.order.fulfillments[0].pickup_details.recipient.display_name, 'Felisha');
   assert.ok(Date.parse(body.order.fulfillments[0].pickup_details.curbside_pickup_details.buyer_arrived_at));
   if (conflict) { conflict = false; arrived = true; return Response.json({ errors: [{ code: 'VERSION_MISMATCH' }] }, { status: 409 }); }
   arrived = true; return Response.json({ order: {} });
  }
  if (url.includes('/orders/')) return Response.json({ order: { id: 'order-1', location_id: wrongLocation ? 'other' : 'location-1', version: 4, state: canceled ? 'CANCELED' : 'OPEN', total_money: { amount: 1600, currency: 'USD' }, tenders: paid ? [{ payment_id: 'payment-1' }] : [], fulfillments: [{ uid: 'curbside', type: 'PICKUP', state: collected ? 'COMPLETED' : 'PROPOSED', pickup_details: { is_curbside_pickup: true, recipient: { display_name: 'Original' }, curbside_pickup_details: arrived ? { buyer_arrived_at: '2026-11-07T04:00:00Z' } : {} } }] } });
  if (url.includes('/payments/')) return Response.json({ payment: { order_id: 'order-1', location_id: 'location-1', status: 'COMPLETED', amount_money: { amount: 1600, currency: 'USD' } } });
  throw new Error('Unexpected provider request');
 };
 const app = express(); app.use(express.json()); app.use('/api/curbside', factory(() => [{ name: 'Milford', squareLocationId: 'location-1' }]));
 server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve)); base = `http://127.0.0.1:${server.address().port}/api/curbside`;
});
after(async () => { global.fetch = realFetch; await new Promise(resolve => server.close(resolve)); });
async function request(path, body, key = token, origin) {
 const response = await realFetch(base + path, { method: body ? 'POST' : 'GET', headers: { 'x-curbside-token': key, 'Content-Type': 'application/json', ...(origin ? { origin } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
 return { status: response.status, data: await response.json() };
}
const details = { name: 'Felisha', vehicle: 'White Honda' };
test('signed links reject tampering, expiry and invalid input', () => {
 assert.equal(factory.readToken(token).orderId, 'order-1');
 assert.equal(factory.readToken(token + 'x'), null);
 assert.equal(factory.readToken('order-1'), null);
 const realNow = Date.now; Date.now = () => realNow() + 8 * 86400000;
 try { assert.equal(factory.readToken(token), null); } finally { Date.now = realNow; }
});
test('unpaid orders cannot send an arrival alert', async () => {
 reset(); paid = false;
 assert.equal((await request('/status')).data.paid, false);
 assert.equal((await request('/arrive', details)).status, 409); assert.equal(updates, 0);
});
test('paid arrival uses the correct fulfillment and repeated taps do not alert again', async () => {
 reset(); assert.equal((await request('/arrive', details)).status, 200); assert.equal(updates, 1);
 assert.equal((await request('/arrive', details)).data.arrived, true); assert.equal(updates, 1);
 assert.equal((await request('/status')).data.arrived, true);
});
test('closed orders and wrong locations cannot check in', async () => {
 reset(); collected = true; assert.equal((await request('/arrive', details)).status, 409);
 collected = false; canceled = true; assert.equal((await request('/arrive', details)).status, 409);
 canceled = false; wrongLocation = true; assert.equal((await request('/arrive', details)).status, 404); assert.equal(updates, 0);
});
test('invalid links, oversized details and cross-origin posts are blocked', async () => {
 reset(); assert.equal((await request('/arrive', details, 'invalid')).status, 404);
 assert.equal((await request('/arrive', { ...details, vehicle: 'x'.repeat(151) })).status, 400);
 assert.equal((await request('/arrive', details, token, 'https://elsewhere.invalid')).status, 403); assert.equal(updates, 0);
});
test('concurrent version conflict rechecks arrival before sending another update', async () => {
 reset(); conflict = true; assert.equal((await request('/arrive', details)).data.arrived, true); assert.equal(updates, 1);
});
