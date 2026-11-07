const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const crypto = require('crypto');
Object.assign(process.env, { SQUARE_ACCESS_TOKEN: 'secret-test', SQUARE_APPLICATION_ID: 'app-test', SQUARE_ENV: 'sandbox', NEXT_PUBLIC_SUPABASE_URL: 'https://cookie-db.invalid', SUPABASE_SECRET_KEY: 'sb_secret_test' });
const factory = require('../cookieCheckout');
const realFetch = global.fetch;
let rows, orders, payments, keys, charges, captures, released, balance, decline, loseAuthorize, loseCapture;
let server, base, router;
function reset() { rows = new Map(); orders = new Map(); payments = new Map(); keys = new Map(); charges = 0; captures = 0; released = 0; balance = 500; decline = false; loseAuthorize = false; loseCapture = false; }
before(async () => {
 global.fetch = async (input, options = {}) => {
  const url = String(input); const body = options.body ? JSON.parse(options.body) : null;
  if (url.startsWith('https://cookie-db.invalid')) {
   assert.equal(options.headers.apikey, 'sb_secret_test'); assert.equal(options.headers.Authorization, undefined);
   const query = new URL(url).searchParams;
   if (options.method === 'POST') { const row = { status: 'open', payments: [], operation: null, lease_until: '1970-01-01', expires_at: new Date(Date.now()+1800000).toISOString(), loyalty_done: false, ...body }; rows.set(row.id,row); return Response.json([structuredClone(row)]); }
   let found = [...rows.values()].filter(row => (!query.has('id') || row.id === query.get('id').slice(3)) && (!query.has('token_hash') || row.token_hash === query.get('token_hash').slice(3)) && (!query.has('lease') || row.lease === query.get('lease').slice(3)) && (!query.has('lease_until') || Date.parse(row.lease_until) < Date.parse(query.get('lease_until').slice(3))));
   if (query.has('or')) found = found.filter(row => ['paying','canceling'].includes(row.status) || row.status==='open' && Date.parse(row.expires_at)<Date.now() || row.status==='paid' && !row.loyalty_done);
   if (options.method === 'PATCH') found.forEach(row => Object.assign(row,body));
   return Response.json(structuredClone(found));
  }
  if (!url.startsWith('https://connect.squareupsandbox.com')) return realFetch(input, options);
  const path = new URL(url).pathname.slice(3);
  if (path === '/loyalty/accounts/search') return Response.json({ loyalty_accounts: [] });
  if (path === '/payments/cancel') { const id = keys.get(body.idempotency_key); if (id && payments.get(id).status==='APPROVED') { payments.get(id).status='CANCELED'; released++; } return Response.json({}); }
  if (path === '/payments') {
   assert.ok(body.idempotency_key.length <= 45); assert.equal(body.autocomplete,false);
   if (decline && !body.accept_partial_authorization) return Response.json({ errors: [{ code: 'CARD_DECLINED' }] }, { status:400 });
   if (keys.has(body.idempotency_key)) return Response.json({ payment:payments.get(keys.get(body.idempotency_key)) });
   charges++;
   const payment = { id:crypto.randomUUID(), order_id:body.order_id, location_id:body.location_id, amount_money:{ amount:body.accept_partial_authorization ? Math.min(balance,body.amount_money.amount) : body.amount_money.amount, currency:'USD' }, status:'APPROVED', card_details:{ card:{ card_brand:body.accept_partial_authorization?'SQUARE_GIFT_CARD':'VISA' } } };
   payments.set(payment.id,payment); keys.set(body.idempotency_key,payment.id);
   if (loseAuthorize) { loseAuthorize=false; throw new Error('Network lost after authorization'); }
   return Response.json({ payment:structuredClone(payment) });
  }
  if (/^\/payments\/[^/]+\/cancel$/.test(path)) { const id=path.split('/')[2]; if (payments.get(id).status==='APPROVED') { payments.get(id).status='CANCELED';released++; } return Response.json({payment:payments.get(id)}); }
  if (path.startsWith('/payments/')) return Response.json({ payment:structuredClone(payments.get(path.split('/')[2])) });
  if (path.endsWith('/pay')) {
   const order=orders.get(path.split('/')[2]);
   assert.equal(body.payment_ids.reduce((n,id)=>n+payments.get(id).amount_money.amount,0),order.total_money.amount);
   captures++;body.payment_ids.forEach(id=>{payments.get(id).status='COMPLETED';payments.get(id).receipt_url='https://squareup.com/receipt/test';});
   if (loseCapture) {loseCapture=false;throw new Error('Lost capture response');}
   return Response.json({order});
  }
  if (path.startsWith('/orders/')) { const order=orders.get(path.split('/')[2]); if(options.method==='PUT') order.version++; return Response.json({order:structuredClone(order)}); }
  throw new Error('Unexpected provider request: '+path);
 };
 const app=express(); app.use(express.json()); router=factory(); app.use('/checkout',router);
 server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));base=`http://127.0.0.1:${server.address().port}/checkout`;
});
after(async()=>{global.fetch=realFetch;await new Promise(resolve=>server.close(resolve));});
async function start(amount=1600) { const order={ id:crypto.randomUUID(), location_id:'loc', total_money:{amount,currency:'USD'},state:'OPEN',version:1,fulfillments:[{uid:'fulfillment',pickup_details:{recipient:{display_name:'Online customer'}}}] };orders.set(order.id,order);return factory.createSession({order,locationName:'Milford',method:'pickup'}); }
async function request(session,action='',body) {const response=await realFetch(`${base}/${session.id}${action?'/'+action:''}`,{ method:body?'POST':'GET',headers:{'Content-Type':'application/json','x-checkout-token':session.token},...(body?{body:JSON.stringify(body)}:{}) });return {status:response.status,data:await response.json()};}
const contact={name:'Felisha',email:'test@example.com',phone:'6035550123'};
const pay=(kind)=>({kind,sourceId:kind+'-nonce',attemptId:crypto.randomUUID()});
test('split payment uses gift balance then exact remainder and captures once',async()=>{reset();const s=await start();const contactResult=await request(s,'contact',contact);assert.equal(contactResult.status,200);assert.equal(contactResult.data.locationId,'loc','contact response must preserve the Square SDK location');let r=await request(s,'payment',pay('gift'));assert.equal(r.data.remaining,1100);assert.equal(r.data.locationId,'loc','split-payment response must preserve the Square SDK location');assert.equal(captures,0);r=await request(s,'payment',pay('card'));assert.equal(r.data.status,'paid');assert.equal(charges,2);assert.equal(captures,1);await request(s,'payment',pay('card'));assert.equal(charges,2);assert.equal(captures,1);});
test('a full gift card places the order without another card',async()=>{reset();balance=5000;const s=await start();await request(s,'contact',contact);const r=await request(s,'payment',pay('gift'));assert.equal(r.data.status,'paid');assert.equal(charges,1);assert.equal(captures,1);});
test('declined remainder does not capture or lose the gift reservation',async()=>{reset();const s=await start();await request(s,'contact',contact);await request(s,'payment',pay('gift'));decline=true;const r=await request(s,'payment',pay('card'));assert.equal(r.status,400);assert.equal(captures,0);const state=await request(s);assert.equal(state.data.remaining,1100);await request(s,'cancel',{});assert.equal(released,1);});
test('unknown authorization is durably recorded and canceled before another attempt',async()=>{reset();const s=await start();await request(s,'contact',contact);loseAuthorize=true;assert.equal((await request(s,'payment',pay('gift'))).status,503);assert.equal((await request(s)).data.needsRecovery,true);await request(s,'payment',pay('gift'));assert.equal(charges,1);await request(s,'recover',{});assert.equal(released,1);assert.equal((await request(s)).data.needsRecovery,false);});
test('lost capture response recovers as paid without charging again',async()=>{reset();balance=2000;const s=await start();await request(s,'contact',contact);loseCapture=true;await request(s,'payment',pay('gift'));assert.equal((await request(s)).data.status,'paying');await router.retryCookieCheckouts();assert.equal((await request(s)).data.status,'paid');assert.equal(charges,1);assert.equal(captures,1);});
test('expired checkout automatically releases authorizations',async()=>{reset();const s=await start();await request(s,'contact',contact);await request(s,'payment',pay('gift'));rows.get(s.id).expires_at='2020-01-01';await router.retryCookieCheckouts();assert.equal((await request(s)).data.status,'canceled');assert.equal(released,1);});
test('wrong ownership, contacts, and concurrent payment requests are rejected',async()=>{reset();const s=await start();assert.equal((await request({...s,token:'a'.repeat(64)})).status,404);assert.equal((await request(s,'contact',{...contact,email:'bad'})).status,503);await request(s,'contact',contact);const results=await Promise.all([request(s,'payment',pay('gift')),request(s,'payment',pay('gift'))]);assert.ok(results.some(r=>r.status>=400));assert.equal(charges,1);assert.equal(captures,0);});
test('changing a Square order total cancels held funds instead of capturing a stale amount',async()=>{reset();const s=await start();await request(s,'contact',contact);await request(s,'payment',pay('gift'));orders.get(rows.get(s.id).square_order_id).total_money.amount=2000;await request(s,'payment',pay('card'));assert.equal((await request(s)).data.status,'canceled');assert.equal(captures,0);assert.equal(released,2);});
test('stored checkout state never contains gift card numbers or payment nonces',async()=>{reset();const s=await start();await request(s,'contact',contact);await request(s,'payment',pay('gift'));const stored=JSON.stringify(rows.get(s.id));assert.equal(stored.includes('gift-nonce'),false);assert.equal(stored.includes(s.token),false);assert.equal(rows.get(s.id).contact.phone,'+16035550123');});
