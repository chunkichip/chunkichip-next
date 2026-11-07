const { test, after } = require('node:test');
const assert = require('node:assert/strict');
process.env.SQUARE_ACCESS_TOKEN = 'test-checkout'; process.env.SQUARE_ENV = 'sandbox'; process.env.SQUARE_LOCATION_ID = 'location-1';
const realFetch = global.fetch; let created; let updated;
global.fetch = async (input, options = {}) => {
 const url = String(input);
 if (!url.startsWith('https://connect.squareupsandbox.com')) return realFetch(input, options);
 const body = JSON.parse(options.body);
 if (options.method === 'POST') { created = body; return Response.json({ payment_link: { id: 'link-1', version: 1, order_id: 'order-1', url: 'https://square.link/test', checkout_options: body.checkout_options } }); }
 if (options.method === 'PUT') { updated = body; return Response.json({ payment_link: { id: 'link-1' } }); }
 throw new Error('Unexpected provider request');
};
const app = require('../server');
const server = app.listen(0, '127.0.0.1');
after(async () => { global.fetch = realFetch; await new Promise(resolve => server.close(resolve)); });
test('curbside checkout creates a pickup fulfillment and signed private return; carryout stays unchanged', async () => {
 if (!server.listening) await new Promise(resolve => server.once('listening', resolve));
 const base = `http://127.0.0.1:${server.address().port}`;
 const payload = { items: [{ variationId: 'variation-1', quantity: 1 }], checkoutMethod: 'curbside' };
 let response = await realFetch(base + '/api/create-checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
 let data = await response.json(); assert.equal(response.status, 200, JSON.stringify(data));
 assert.equal(created.order.fulfillments[0].pickup_details.is_curbside_pickup, true);
 assert.equal(created.order.fulfillments[0].pickup_details.schedule_type, 'ASAP');
 assert.equal(updated.payment_link.checkout_options.redirect_url, data.curbsideCheckinUrl);
 assert.equal(updated.payment_link.checkout_options.enable_loyalty, true);
 const claims = require('../curbside').readToken(new URL(data.curbsideCheckinUrl).hash.slice(1));
 assert.equal(claims.orderId, 'order-1'); assert.equal(claims.locationId, 'location-1');
 updated = null; payload.checkoutMethod = 'pickup';
 response = await realFetch(base + '/api/create-checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); data = await response.json();
 assert.equal(response.status, 200); assert.equal(created.order.fulfillments, undefined); assert.equal(updated, null); assert.equal(data.curbsideCheckinUrl, undefined);
});
