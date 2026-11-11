const { test, after } = require('node:test');
const assert = require('node:assert/strict');
process.env.CHECKOUT_REDIRECT_URL = 'https://old-shop.invalid/';
process.env.SQUARE_ACCESS_TOKEN = 'test-checkout'; process.env.SQUARE_ENV = 'sandbox'; process.env.SQUARE_LOCATION_ID = 'location-1';
const realFetch = global.fetch; let created; let updated; let creates = 0;
global.fetch = async (input, options = {}) => {
 const url = String(input);
 if (!url.startsWith('https://connect.squareupsandbox.com')) return realFetch(input, options);
 if (url.includes('/v2/locations/')) return Response.json({location:{status:'ACTIVE',timezone:'America/New_York',business_hours:{periods:['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'].map(day_of_week=>({day_of_week,start_local_time:'00:00:00',end_local_time:'23:59:00'}))}}});
 const body = JSON.parse(options.body);
 if (options.method === 'POST') { creates++; created = body; return Response.json({ payment_link: { id: 'link-1', version: 1, order_id: 'order-1', url: 'https://square.link/test', checkout_options: body.checkout_options } }); }
 if (options.method === 'PUT') { updated = body; return Response.json({ payment_link: { id: 'link-1' } }); }
 throw new Error('Unexpected provider request');
};
const app = require('../server');
const server = app.listen(0, '127.0.0.1');
after(async () => { global.fetch = realFetch; await new Promise(resolve => server.close(resolve)); });
test('scheduled curbside and carryout have exact pickup timestamps; curbside retains its signed return', async () => {
 if (!server.listening) await new Promise(resolve => server.once('listening', resolve));
 const base = `http://127.0.0.1:${server.address().port}`;
 const menu = await (await realFetch(base+'/api/pickup-options')).json();
 const selected = menu.slots.find(s=>s.date!==menu.slots[0].date);
 const payload = { pickupAt:selected.at, items: [{ variationId: 'variation-1', quantity: 1 }], checkoutMethod: 'curbside' };
 let response = await realFetch(base + '/api/create-checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
 let data = await response.json(); assert.equal(response.status, 200, JSON.stringify(data));
 assert.equal(created.order.fulfillments[0].pickup_details.is_curbside_pickup, true);
 assert.equal(created.order.fulfillments[0].pickup_details.schedule_type, 'SCHEDULED');
 assert.equal(created.order.fulfillments[0].pickup_details.pickup_at, selected.at);
 assert.equal(created.order.fulfillments[0].pickup_details.prep_time_duration, 'PT15M');
 assert.match(created.order.fulfillments[0].pickup_details.note, /Pickup:/);
 assert.match(created.payment_note, /Pickup:/);
 assert.equal(updated.payment_link.checkout_options.redirect_url, data.curbsideCheckinUrl);
 assert.equal(new URL(data.curbsideCheckinUrl).hostname, '127.0.0.1');
 assert.equal(updated.payment_link.checkout_options.enable_loyalty, true);
 const claims = require('../curbside').readToken(new URL(data.curbsideCheckinUrl).hash.slice(1));
 assert.equal(claims.orderId, 'order-1'); assert.equal(claims.locationId, 'location-1');
 updated = null; payload.checkoutMethod = 'pickup';
 response = await realFetch(base + '/api/create-checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); data = await response.json();
 assert.equal(response.status, 200); assert.equal(created.order.fulfillments[0].pickup_details.pickup_at, selected.at); assert.equal(created.order.fulfillments[0].pickup_details.schedule_type,'SCHEDULED'); assert.equal(created.order.fulfillments[0].pickup_details.is_curbside_pickup,undefined); assert.equal(updated, null); assert.equal(data.curbsideCheckinUrl, undefined);
 const before=creates;
 for(const pickupAt of [undefined, 'bad', '2020-01-01T16:00:00.000Z', new Date(Date.now()+40*86400000).toISOString()]) {
  const r=await realFetch(base+'/api/create-checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,pickupAt})});
  assert.equal(r.status,400);
 }
 assert.equal(creates,before);
});
