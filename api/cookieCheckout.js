const express = require('express');
const crypto = require('crypto');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const env = key => (process.env[key] || '').trim();
const configured = () => Boolean(env('SQUARE_ACCESS_TOKEN') && env('SQUARE_APPLICATION_ID') && env('NEXT_PUBLIC_SUPABASE_URL') && (env('SUPABASE_SECRET_KEY') || env('SUPABASE_SERVICE_ROLE_KEY')));
async function db(query, method = 'GET', body) {
 const key = env('SUPABASE_SECRET_KEY') || env('SUPABASE_SERVICE_ROLE_KEY');
 const response = await fetch(`${env('NEXT_PUBLIC_SUPABASE_URL')}/rest/v1/cookie_checkout_sessions?${query}`, { method, headers: { apikey: key, ...(key.startsWith('sb_secret_') ? {} : { Authorization: `Bearer ${key}` }), 'Content-Type': 'application/json', Prefer: 'return=representation' }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000) });
 if (!response.ok) throw new Error('Order storage is temporarily unavailable.');
 return response.json();
}
async function square(path, body, method) {
 const host = env('SQUARE_ENV') === 'production' ? 'https://connect.squareup.com' : 'https://connect.squareupsandbox.com';
 const response = await fetch(`${host}/v2${path}`, { method: method || (body ? 'POST' : 'GET'), headers: { Authorization: `Bearer ${env('SQUARE_ACCESS_TOKEN')}`, 'Content-Type': 'application/json', 'Square-Version': '2026-09-16' }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000) });
 const data = await response.json();
 if (!response.ok || data.errors?.length) {
  const code = data.errors?.[0]?.code || 'UNKNOWN';
  console.warn('Cookie checkout Square request failed', response.status, String(code).replace(/[^A-Z_]/g, ''));
  const error = new Error('Square could not complete this request. Please check your order status before trying again.');
  error.definite = response.status >= 400 && response.status < 500 && response.status !== 429;
  error.declined = ['CARD_DECLINED','CVV_FAILURE','ADDRESS_VERIFICATION_FAILURE','INSUFFICIENT_FUNDS','CARD_EXPIRED','INVALID_EXPIRATION','EXPIRATION_FAILURE','GENERIC_DECLINE'].includes(code);
  throw error;
 }
 return data;
}
async function createSession({ order, locationName, method, contact }) {
 if (!configured()) throw new Error('Gift card checkout is temporarily unavailable.');
 const total = Number(order.total_money?.amount ?? order.totalMoney?.amount);
 const currency = order.total_money?.currency ?? order.totalMoney?.currency;
 if (!order.id || !Number.isSafeInteger(total) || total <= 0 || total > 1000000 || currency !== 'USD') throw new Error('Square did not return a valid order total.');
 const id = crypto.randomUUID(); const token = crypto.randomBytes(32).toString('hex');
 await db('', 'POST', { id, token_hash: hash(token), square_order_id: order.id, location_id: order.location_id || order.locationId, location_name: locationName, method, amount: total, contact: contact || null });
 return { id, token };
}
module.exports = function cookieCheckout() {
 const router = express.Router(); const limits = new Map();
 router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  if (req.get('origin')) { try { if (new URL(req.get('origin')).host !== req.get('host')) return res.status(403).json({ error: 'Use the Chunki Chip website.' }); } catch { return res.status(403).json({ error: 'Invalid origin.' }); } }
  const now = Date.now(); for (const [id, bucket] of limits) if (bucket.until < now) limits.delete(id);
  const key = req.get('x-checkout-token') || req.ip; const bucket = limits.get(key) || { count: 0, until: now + 60000 };
  if (limits.size > 5000 || ++bucket.count > 90) return res.status(429).json({ error: 'Please wait a minute before trying again.' }); limits.set(key, bucket);
  next();
 });
 async function owned(req) {
  const token = req.get('x-checkout-token');
  if (!uuid(req.params.id) || !/^[a-f0-9]{64}$/.test(token || '')) return null;
  return (await db(`id=eq.${req.params.id}&token_hash=eq.${hash(token)}&limit=1`))[0] || null;
 }
 async function claim(row) {
  const lease = crypto.randomUUID();
  return (await db(`id=eq.${row.id}&lease_until=lt.${encodeURIComponent(new Date().toISOString())}`, 'PATCH', { lease, lease_until: new Date(Date.now() + 180000).toISOString() }))[0] || null;
 }
 async function save(row, patch) {
  const result = await db(`id=eq.${row.id}&lease=eq.${row.lease}`, 'PATCH', patch);
  if (!result.length) throw new Error('Order is being updated. Please check its status.');
  Object.assign(row, result[0]);
 }
 async function payments(row) {
  const found = [];
  for (const item of row.payments) {
   const { payment } = await square(`/payments/${encodeURIComponent(item.id)}`);
   if (payment.order_id !== row.square_order_id || payment.location_id !== row.location_id || payment.amount_money?.currency !== 'USD' || Number(payment.refunded_money?.amount || 0) > 0) throw new Error('Payment needs a manual review.');
   found.push({ ...item, amount: Number(payment.amount_money.amount), status: payment.status, receipt: payment.receipt_url });
  }
  return found;
 }
 async function awardPoints(row) {
  if (row.loyalty_done || !row.contact?.phone) return;
  const result = await square('/loyalty/accounts/search', { query: { mappings: [{ phone_number: row.contact.phone }] }, limit: 1 });
  const account = result.loyalty_accounts?.[0];
  if (account) await square(`/loyalty/accounts/${encodeURIComponent(account.id)}/accumulate`, { idempotency_key: `lp-${row.id}`, location_id: row.location_id, accumulate_points: { order_id: row.square_order_id } });
  await save(row, { loyalty_done: true });
 }
 async function finish(row) {
  const list = await payments(row);
  const total = list.filter(item => ['APPROVED','COMPLETED'].includes(item.status)).reduce((sum, item) => sum + item.amount, 0);
  const { order } = await square(`/orders/${encodeURIComponent(row.square_order_id)}`);
  if (Number(order.total_money?.amount) !== row.amount || order.total_money?.currency !== 'USD' || order.location_id !== row.location_id || order.state === 'CANCELED') {
   if (!list.some(item => item.status === 'COMPLETED')) { await save(row, { status: 'canceling' }); await cancel(row); }
   else await save(row, { status: 'attention' });
   throw new Error('The order changed. Payment authorizations were stopped; please contact the shop before placing another order.');
  }
  if (total !== row.amount || !list.length) {
   if (!list.some(item => item.status === 'COMPLETED')) { await save(row, { status: 'canceling' }); await cancel(row); }
   else await save(row, { status: 'attention' });
   throw new Error('Payment authorizations no longer cover the order. This checkout was stopped; please contact the shop if you need help.');
  }
  if (!list.every(item => item.status === 'COMPLETED')) await square(`/orders/${encodeURIComponent(row.square_order_id)}/pay`, { idempotency_key: `pay-${row.id}`, payment_ids: list.map(item => item.id) });
  const confirmed = await payments(row);
  if (!confirmed.every(item => item.status === 'COMPLETED')) throw new Error('Square is still confirming payment.');
  await save(row, { status: 'paid', receipt_url: confirmed.find(item => item.receipt)?.receipt || null });
  try { await awardPoints(row); } catch { /* The worker retries loyalty separately; paid cookies remain paid. */ }
 }
 async function cancel(row) {
  if (row.status === 'paid') return;
  if (row.status === 'paying') { await finish(row); return; }
  await save(row, { status: 'canceling' });
  if (row.operation) await square('/payments/cancel', { idempotency_key: row.operation.key });
  for (const item of row.payments) {
   const { payment } = await square(`/payments/${encodeURIComponent(item.id)}`);
   if (payment.status === 'COMPLETED') { await save(row, { status: 'attention' }); throw new Error('Payment needs a manual review.'); }
   if (payment.status === 'APPROVED') await square(`/payments/${encodeURIComponent(item.id)}/cancel`, {});
  }
  await save(row, { status: 'canceled', operation: null });
 }
 async function snapshot(row) {
  const list = await payments(row);
  const reserved = list.filter(item => ['APPROVED','COMPLETED'].includes(item.status)).reduce((sum, item) => sum + item.amount, 0);
  return { id: row.id, locationId: row.location_id, status: row.status, amount: row.amount, reserved, remaining: Math.max(0, row.amount - reserved), giftApplied: list.some(item => item.kind === 'gift' && ['APPROVED','COMPLETED'].includes(item.status)), needsRecovery: Boolean(row.operation), contact: row.contact, method: row.method, location: row.location_name, receiptUrl: row.receipt_url, expiresAt: row.expires_at, ...(row.method === 'curbside' && row.status === 'paid' ? { curbsideToken: require('./curbside').createToken(row.square_order_id, row.location_id) } : {}) };
 }
 router.get('/config', async (_req, res) => {
  let available = configured(); if (available) { try { await db('select=id&limit=0'); } catch { available = false; } }
  res.json({ available, ...(available ? { applicationId: env('SQUARE_APPLICATION_ID'), sandbox: env('SQUARE_ENV') !== 'production' } : {}) });
 });
 router.get('/:id', async (req, res) => {
  try { const row = await owned(req); if (!row) return res.status(404).json({ error: 'Checkout not found. Use your private checkout link.' }); res.json({ ...(await snapshot(row)), locationId: row.location_id }); }
  catch { res.status(503).json({ error: 'Could not check the order. Please try again.' }); }
 });
 async function mutate(req, res, action) {
  let row;
  try {
   const found = await owned(req); if (!found) return res.status(404).json({ error: 'Checkout not found.' });
   row = await claim(found); if (!row) return res.status(409).json({ error: 'Your order is being updated. Please check its status.' });
   if (row.status === 'paid') return res.json(await snapshot(row));
   if (row.status === 'paying') { await finish(row); return res.json(await snapshot(row)); }
   if (action !== 'cancel' && (row.status !== 'open' || Date.parse(row.expires_at) < Date.now())) return res.status(409).json({ error: 'This checkout is closed or expired. Cancel it to release any gift card authorization.' });
   await actionHandler(row, action, req.body);
   res.json(await snapshot(row));
  } catch (error) { res.status(error.declined ? 400 : 503).json({ error: error.declined ? 'That payment was declined or the gift card has no available balance. Check the details or try another card.' : error.message }); }
  finally { if (row) await save(row, { lease_until: '1970-01-01T00:00:00Z' }).catch(() => {}); }
 }
 async function actionHandler(row, action, body) {
  if (action === 'cancel') return cancel(row);
  if (action === 'recover') {
   if (row.operation) { await square('/payments/cancel', { idempotency_key: row.operation.key }); await save(row, { operation: null }); }
   return;
  }
  if (action === 'contact') {
   if (row.operation || row.payments.length) throw new Error('Contact details cannot change after a payment authorization.');
   const name = typeof body.name === 'string' ? body.name.trim() : ''; const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''; const digits = String(body.phone || '').replace(/\D/g, ''); const phone = digits.length === 10 ? '+1' + digits : digits.length === 11 && digits.startsWith('1') ? '+' + digits : '';
   if (!name || name.length > 100 || email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) || !/^\+?[\d ()-]{10,25}$/.test(phone)) throw new Error('Enter your name, email and a valid phone number.');
   const { order } = await square(`/orders/${encodeURIComponent(row.square_order_id)}`);
   const fulfillment = order.fulfillments?.[0]; if (!fulfillment) throw new Error('Order fulfillment is missing.');
   const field = row.method === 'shipping' ? 'shipment_details' : 'pickup_details';
   await square(`/orders/${encodeURIComponent(row.square_order_id)}`, { order: { location_id: row.location_id, version: order.version, fulfillments: [{ uid: fulfillment.uid, [field]: { recipient: { ...fulfillment[field]?.recipient, display_name: name, email_address: email, phone_number: phone } } }] } }, 'PUT');
   return save(row, { contact: { name, email, phone } });
  }
  if (action === 'complete') { await save(row, { status: 'paying' }); return finish(row); }
  if (action === 'payment') {
   if (!row.contact) throw new Error('Add your contact details first.');
   if (row.operation) throw new Error('A previous attempt needs checking. Release that attempt before trying another payment.');
   if (!['gift','card'].includes(body.kind) || typeof body.sourceId !== 'string' || !body.sourceId || body.sourceId.length > 1000 || !uuid(body.attemptId)) throw new Error('Enter valid payment details.');
   if (row.payments.some(item => item.attemptId === body.attemptId)) return;
   const list = await payments(row); const held = list.filter(item => ['APPROVED','COMPLETED'].includes(item.status));
   if (body.kind === 'gift' && held.some(item => item.kind === 'gift')) throw new Error('A gift card is already applied. Use a credit or debit card for the remaining balance.');
   const remaining = row.amount - held.reduce((sum, item) => sum + item.amount, 0);
   if (remaining <= 0) { await save(row, { status: 'paying' }); return finish(row); }
   const key = 'ck-' + hash(row.id + ':' + body.attemptId).slice(0, 40); await save(row, { operation: { key } });
   let payment;
   try {
    ({ payment } = await square('/payments', { idempotency_key: key, source_id: body.sourceId, order_id: row.square_order_id, location_id: row.location_id, amount_money: { amount: remaining, currency: 'USD' }, autocomplete: false, accept_partial_authorization: body.kind === 'gift', buyer_email_address: row.contact.email, reference_id: row.id, note: 'Chunki Chip online cookie order' }));
   } catch (error) { if (error.definite) await save(row, { operation: null }); throw error; }
   if (payment.order_id !== row.square_order_id || payment.location_id !== row.location_id || payment.amount_money?.currency !== 'USD' || !['APPROVED','COMPLETED'].includes(payment.status) || Number(payment.amount_money.amount) > remaining || Number(payment.amount_money.amount) <= 0) throw new Error('Square returned a payment that needs checking.');
   if (body.kind === 'gift' && payment.card_details?.card?.card_brand !== 'SQUARE_GIFT_CARD') { await square('/payments/cancel', { idempotency_key: key }); await save(row, { operation: null }); throw new Error('Please use a Chunki Chip gift card in the gift card field.'); }
   // Funds remain authorized until PayOrder captures the exact full order amount.
   await save(row, { payments: [...row.payments, { id: payment.id, kind: body.kind, amount: Number(payment.amount_money.amount), attemptId: body.attemptId }], operation: null });
   if (held.reduce((sum, item) => sum + item.amount, 0) + Number(payment.amount_money.amount) === row.amount) { await save(row, { status: 'paying' }); await finish(row); }
  }
 }
 for (const action of ['contact','payment','recover','cancel','complete']) router.post(`/:id/${action}`, (req, res) => mutate(req, res, action));
 let working = false;
 async function work() {
  if (working || !configured()) return; working = true;
  try {
   // Payment recovery takes priority over optional loyalty retries.
   const cutoff = encodeURIComponent(new Date().toISOString());
   const rows = await db(`or=(status.eq.paying,status.eq.canceling,and(status.eq.open,expires_at.lt.${cutoff}))&lease_until=lt.${cutoff}&order=expires_at.asc&limit=20`);
   const loyaltyRows = await db(`status=eq.paid&loyalty_done=eq.false&lease_until=lt.${cutoff}&order=created_at.asc&limit=3`);
   rows.push(...loyaltyRows.filter(item => !rows.some(row => row.id === item.id)));
   for (const found of rows) {
    const row = await claim(found); if (!row) continue;
    try { if (row.status === 'paid') await awardPoints(row); else if (row.status === 'paying') await finish(row); else await cancel(row); }
    catch { /* Retry persisted authorizations and capture on the next pass. */ }
    finally { await save(row, { lease_until: '1970-01-01T00:00:00Z' }).catch(() => {}); }
   }
  } catch { /* A temporary provider/storage outage is retried. */ }
  finally { working = false; }
 }
 const interval = setInterval(work, 30000); interval.unref?.(); router.retryCookieCheckouts = work;
 return router;
};
module.exports.createSession = createSession;
module.exports.configured = configured;
