const crypto = require('crypto');
const express = require('express');

function signature(payload) {
  return crypto.createHmac('sha256', process.env.CURBSIDE_CHECKIN_SECRET || process.env.SQUARE_ACCESS_TOKEN).update(`curbside-v1:${payload}`).digest();
}
function createToken(orderId, locationId) {
  const payload = Buffer.from(JSON.stringify({ orderId, locationId, expires: Date.now() + 7 * 86400000 })).toString('base64url');
  return `${payload}.${signature(payload).toString('base64url')}`;
}
function readToken(token) {
  if (typeof token !== 'string' || token.length > 1500 || !process.env.SQUARE_ACCESS_TOKEN) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const actual = Buffer.from(parts[1], 'base64url'); const expected = signature(parts[0]);
    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
    const data = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    return typeof data.orderId === 'string' && typeof data.locationId === 'string' && data.expires > Date.now() ? data : null;
  } catch { return null; }
}
async function square(path, method = 'GET', body) {
  const host = process.env.SQUARE_ENV === 'production' ? 'https://connect.squareup.com' : 'https://connect.squareupsandbox.com';
  const response = await fetch(`${host}/v2${path}`, { method, headers: { Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`, 'Square-Version': '2026-09-16', 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(12000) });
  const result = await response.json();
  if (!response.ok || result.errors?.length) {
    const error = new Error('Square could not confirm the check-in. Please try again.');
    error.conflict = result.errors?.some(item => item.code === 'VERSION_MISMATCH');
    console.warn('Curbside Square request failed', response.status, result.errors?.[0]?.code || 'UNKNOWN');
    throw error;
  }
  return result;
}
module.exports = function curbside(configuredLocations) {
  const router = express.Router(); const attempts = new Map();
  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (req.method === 'POST' && req.get('origin')) {
      try { if (new URL(req.get('origin')).host !== req.get('host')) return res.status(403).json({ error: 'Please check in from the Chunki Chip website.' }); }
      catch { return res.status(403).json({ error: 'Invalid request.' }); }
    }
    next();
  });
  async function inspect(req) {
    const claims = readToken(req.get('x-curbside-token'));
    const location = claims && configuredLocations().find(item => item.squareLocationId === claims.locationId);
    if (!location) return { error: 'This check-in link is invalid or expired. Please contact the shop.', code: 404 };
    const { order } = await square(`/orders/${encodeURIComponent(claims.orderId)}`);
    const fulfillment = order?.fulfillments?.find(item => item.type === 'PICKUP' && item.pickup_details?.is_curbside_pickup);
    if (!order || order.location_id !== claims.locationId || !fulfillment) return { error: 'A curbside order could not be found for this link.', code: 404 };
    if (order.state === 'CANCELED' || ['CANCELED', 'FAILED'].includes(fulfillment.state)) return { error: 'This order has been canceled. Please contact the shop.', code: 409 };
    const paymentIds = [...new Set((order.tenders || []).map(item => item.payment_id).filter(Boolean))];
    let paid = 0;
    for (const id of paymentIds) {
      const { payment } = await square(`/payments/${encodeURIComponent(id)}`);
      if (payment?.status === 'COMPLETED' && payment.order_id === order.id && payment.location_id === claims.locationId && payment.amount_money?.currency === order.total_money?.currency) paid += Number(payment.amount_money.amount) - Number(payment.refunded_money?.amount || 0);
    }
    return { claims, location, order, fulfillment, paid: paid >= Number(order.total_money?.amount) && paid > 0 };
  }
  router.get('/status', async (req, res) => {
    try {
      const found = await inspect(req);
      if (found.error) return res.status(found.code).json({ error: found.error });
      res.json({ paid: found.paid, location: found.location.name, arrived: Boolean(found.fulfillment.pickup_details.curbside_pickup_details?.buyer_arrived_at), collected: found.fulfillment.state === 'COMPLETED' });
    } catch { res.status(503).json({ error: 'Could not check your order. Please try again or contact the shop.' }); }
  });
  router.post('/arrive', async (req, res) => {
    const clean = value => typeof value === 'string' ? value.trim() : '';
    const name = clean(req.body?.name); const vehicle = clean(req.body?.vehicle);
    if (!name || name.length > 100 || !vehicle || vehicle.length > 150) return res.status(400).json({ error: 'Enter your order name and vehicle color, make/model or parking spot.' });
    const token = req.get('x-curbside-token');
    if (!readToken(token)) return res.status(404).json({ error: 'This check-in link is invalid or expired. Please contact the shop.' });
    const key = crypto.createHash('sha256').update(token).digest('hex'); const now = Date.now();
    for (const [id, entry] of attempts) if (entry.until < now) attempts.delete(id);
    const entry = attempts.get(key) || { count: 0, until: now + 60000 };
    if (attempts.size > 5000 || ++entry.count > 10) return res.status(429).json({ error: 'Please wait a minute before checking in again.' });
    attempts.set(key, entry);
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        const found = await inspect(req);
        if (found.error) return res.status(found.code).json({ error: found.error });
        if (!found.paid) return res.status(409).json({ error: 'Your payment has not been confirmed yet. Complete checkout, then try again.' });
        if (found.fulfillment.state === 'COMPLETED') return res.status(409).json({ error: 'This order is already marked as collected. Please contact the shop if you still need it.' });
        if (found.fulfillment.pickup_details.curbside_pickup_details?.buyer_arrived_at) return res.json({ arrived: true });
        try {
          await square(`/orders/${encodeURIComponent(found.order.id)}`, 'PUT', { idempotency_key: crypto.randomUUID(), order: { location_id: found.claims.locationId, version: found.order.version, fulfillments: [{ uid: found.fulfillment.uid, pickup_details: { recipient: { ...found.fulfillment.pickup_details.recipient, display_name: name }, is_curbside_pickup: true, curbside_pickup_details: { curbside_details: vehicle, buyer_arrived_at: new Date().toISOString() } } }] } });
          return res.json({ arrived: true });
        } catch (error) { if (!error.conflict || attempt) throw error; }
      }
    } catch { res.status(503).json({ error: 'We could not confirm your check-in. Try again. If you are waiting outside, please contact the shop.' }); }
  });
  return router;
};
module.exports.createToken = createToken;
module.exports.readToken = readToken;
