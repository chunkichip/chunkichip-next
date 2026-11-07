const express = require('express');
const crypto = require('crypto');
const designs = require('./giftCardDesigns.json');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const emailOK = value => typeof value === 'string' && value.length <= 254 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);
const uuidOK = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const tokenOK = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const dollars = value => `$${(value / 100).toFixed(2)}`;

function validateGift(value) {
  if (!Number.isInteger(value.amount) || value.amount < 500 || value.amount > 50000) throw new Error('Choose an amount from $5 to $500.');
  if (!designs.some(d => d.id === value.designId)) throw new Error('Choose a card design.');
  if (!emailOK(value.recipientEmail) || !emailOK(value.buyerEmail)) throw new Error('Enter valid email addresses.');
  for (const field of ['recipientName', 'buyerName']) if (typeof value[field] !== 'string' || !value[field].trim() || value[field].length > 100) throw new Error('Enter the sender and recipient names.');
  if (typeof value.message !== 'string' || value.message.length > 500) throw new Error('Keep the message under 500 characters.');
  return { amount: value.amount, design_id: value.designId, recipient_name: value.recipientName.trim(), recipient_email: value.recipientEmail.trim().toLowerCase(), buyer_name: value.buyerName.trim(), buyer_email: value.buyerEmail.trim().toLowerCase(), message: value.message.trim() };
}

function emailBody(row, gan) {
  const design = designs.find(d => d.id === row.design_id);
  return `<div style="background:#f5f7fa;padding:30px;font-family:Arial,sans-serif;color:#171315"><div style="max-width:560px;margin:auto;background:white;border-radius:24px;padding:28px"><h1 style="color:#eb2327">You've got good taste.</h1><p>Hi ${escape(row.recipient_name)}, ${escape(row.buyer_name)} sent you a Chunki Chip gift card!</p><img src="${design.image}" alt="${escape(design.name)}" style="display:block;width:100%;border-radius:18px"/><h2 style="color:#eb2327;font-size:36px">${dollars(row.amount)}</h2>${row.message ? `<p style="white-space:pre-wrap;background:#ffccef;padding:20px;border-radius:16px">${escape(row.message)}</p>` : ''}<p>Your gift card number</p><p style="font-size:22px;font-weight:bold;letter-spacing:2px">${escape(gan.replace(/(.{4})/g, '$1 ').trim())}</p><p>Show this number at Chunki Chip to use your gift card. Keep it private, just like cash.</p><p>Chunki Chip · Gift order ${escape(row.id)}</p></div></div>`;
}

module.exports = function giftCards() {
  const router = express.Router();
  const limits = new Map();
  const env = key => (process.env[key] || '').trim();
  const location = () => env('SQUARE_LOCATION_ID_MILFORD') || env('SQUARE_LOCATION_ID');
  const ready = () => Boolean(env('GIFT_CARD_SALES_ENABLED') === 'true' && env('SQUARE_APPLICATION_ID') && env('SQUARE_ACCESS_TOKEN') && location() && env('NEXT_PUBLIC_SUPABASE_URL') && env('SUPABASE_SERVICE_ROLE_KEY') && env('RESEND_API_KEY') && env('GIFT_CARD_EMAIL_FROM'));
  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    const origin = req.get('origin');
    if (origin) {
      try { if (new URL(origin).host !== req.get('host')) return res.status(403).json({ error: 'Please use the Chunki Chip website.' }); }
      catch { return res.status(403).json({ error: 'Invalid origin.' }); }
    }
    if (req.method === 'POST') {
      const now = Date.now();
      for (const [key, bucket] of limits) if (bucket.until < now) limits.delete(key);
      if (!limits.has(req.ip)) {
        if (limits.size >= 5000) return res.status(429).json({ error: 'Please try again shortly.' });
        limits.set(req.ip, { count: 0, until: now + 60000 });
      }
      if (++limits.get(req.ip).count > 60) return res.status(429).json({ error: 'Please wait a minute before trying again.' });
    }
    next();
  });
  async function db(query, method = 'GET', body) {
    const key = env('SUPABASE_SERVICE_ROLE_KEY');
    const response = await fetch(`${env('NEXT_PUBLIC_SUPABASE_URL')}/rest/v1/gift_card_orders?${query}`, {
      method, headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error('Gift order storage unavailable');
    return response.json();
  }
  async function square(path, body) {
    const host = env('SQUARE_ENV') === 'production' ? 'https://connect.squareup.com' : 'https://connect.squareupsandbox.com';
    const response = await fetch(`${host}/v2${path}`, {
      method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${env('SQUARE_ACCESS_TOKEN')}`, 'Square-Version': '2026-09-16', 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000),
    });
    const result = await response.json();
    if (!response.ok || result.errors?.length) {
      const code = String(result.errors?.[0]?.code || 'UNAVAILABLE').replace(/[^A-Z_]/g, '').slice(0, 70);
      console.error('Gift card Square request failed', response.status, code);
      const error = new Error('Square is temporarily unavailable');
      error.declined = ['CARD_DECLINED','CVV_FAILURE','ADDRESS_VERIFICATION_FAILURE','INSUFFICIENT_FUNDS','EXPIRATION_FAILURE','INVALID_EXPIRATION','CARD_EXPIRED','GENERIC_DECLINE'].includes(code);
      throw error;
    }
    return result;
  }
  async function owned(req) {
    if (!uuidOK(req.params.id)) return null;
    const token = req.get('x-gift-order-token');
    if (!tokenOK(token)) return null;
    const rows = await db(`id=eq.${req.params.id}&token_hash=eq.${hash(token)}&limit=1`);
    return rows[0] || null;
  }
  async function claim(id) {
    const lease = crypto.randomUUID();
    const rows = await db(`id=eq.${id}&lease_until=lt.${encodeURIComponent(new Date().toISOString())}&status=not.in.(sent,payment_failed,attention)`, 'PATCH', { lease, lease_until: new Date(Date.now() + 180000).toISOString() });
    return rows[0] ? { ...rows[0], lease } : null;
  }
  async function save(row, changes) {
    const rows = await db(`id=eq.${row.id}&lease=eq.${row.lease}`, 'PATCH', changes);
    if (!rows.length) throw new Error('Gift order lease lost');
    Object.assign(row, rows[0]);
  }
  async function release(row) { await save(row, { lease_until: '1970-01-01T00:00:00Z' }); }
  async function fulfill(row) {
    const { order } = await square(`/orders/${encodeURIComponent(row.square_order_id)}`);
    // Never activate from browser status or a redirect; confirm payment at Square.
    if (order.state !== 'COMPLETED' || Number(order.total_money?.amount) !== row.amount || order.total_money?.currency !== 'USD' || !(order.tenders || []).some(t => t.payment_id)) {
      await save(row, { next_retry: new Date(Date.now() + 60000).toISOString() });
      return;
    }
    const tender = order.tenders.find(t => t.payment_id);
    const { payment } = await square(`/payments/${encodeURIComponent(tender.payment_id)}`);
    if (payment.status !== 'COMPLETED' || payment.order_id !== row.square_order_id || payment.location_id !== row.location_id || Number(payment.amount_money?.amount) !== row.amount || payment.amount_money?.currency !== 'USD' || Number(payment.refunded_money?.amount || 0) > 0) throw new Error('Payment not eligible for gift card activation');
    await save(row, { status: 'paid', payment_id: payment.id, receipt_url: payment.receipt_url || row.receipt_url || null });
    if (!row.gift_card_id) {
      const { gift_card } = await square('/gift-cards', { idempotency_key: `gift-create-${row.id}`, location_id: row.location_id, gift_card: { type: 'DIGITAL' } });
      await save(row, { gift_card_id: gift_card.id });
    }
    await square('/gift-cards/activities', { idempotency_key: `gift-activate-${row.id}`, gift_card_activity: { type: 'ACTIVATE', location_id: row.location_id, gift_card_id: row.gift_card_id, activate_activity_details: { order_id: row.square_order_id, line_item_uid: 'gift' } } });
    const { gift_card } = await square(`/gift-cards/${encodeURIComponent(row.gift_card_id)}`);
    if (gift_card.state !== 'ACTIVE' || !gift_card.gan) throw new Error('Gift card not active');
    // After an ambiguous email response, stop automatic retries before Resend's 24h deduplication window expires.
    if (row.email_started_at && Date.now() - Date.parse(row.email_started_at) >= 23 * 60 * 60 * 1000) {
      await save(row, { status: 'attention' });
      return;
    }
    if (!row.email_started_at) await save(row, { email_started_at: new Date().toISOString() });
    const design = designs.find(d => d.id === row.design_id);
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${env('RESEND_API_KEY')}`, 'Content-Type': 'application/json', 'Idempotency-Key': `chunki-gift-${row.id}` },
      body: JSON.stringify({ from: env('GIFT_CARD_EMAIL_FROM'), to: [row.recipient_email], subject: 'A Chunki Chip gift card for you', html: emailBody(row, gift_card.gan), text: `Hi ${row.recipient_name}, ${row.buyer_name} sent you a ${dollars(row.amount)} Chunki Chip gift card.\n${row.message}\nGift card number: ${gift_card.gan}\nShow this number at Chunki Chip. Keep it private.\nDesign: ${design.name}\nOrder: ${row.id}` }), signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error('Gift card email unavailable');
    const result = await response.json();
    if (!result.id) throw new Error('Gift card email unavailable');
    await save(row, { status: 'sent', email_id: result.id, sent_at: new Date().toISOString() });
  }
  async function processOrder(id) {
    const row = await claim(id);
    if (!row) return;
    try { await fulfill(row); }
    catch { console.error('Gift card fulfillment needs retry', row.id); await save(row, { attempts: row.attempts + 1, next_retry: new Date(Date.now() + Math.min(3600000, 30000 * 2 ** Math.min(row.attempts, 7))).toISOString() }); }
    finally { await release(row); }
  }
  let working = false;
  async function work() {
    if (!ready() || working) return;
    working = true;
    try {
      const rows = await db(`square_order_id=not.is.null&status=in.(pending,processing,paid)&next_retry=lt.${encodeURIComponent(new Date().toISOString())}&order=created_at.asc&limit=10`);
      for (const row of rows) {
        if (Date.now() - Date.parse(row.created_at) > 48 * 60 * 60 * 1000 && row.status !== 'paid') {
          await db(`id=eq.${row.id}&lease_until=lt.${encodeURIComponent(new Date().toISOString())}`, 'PATCH', { status: 'attention' });
          continue;
        }
        await processOrder(row.id);
      }
    } catch { console.error('Gift card delivery worker unavailable'); }
    finally { working = false; }
  }
  const timer = setInterval(work, 30000);
  timer.unref();
  router.get('/config', async (_req, res) => {
    let available = ready();
    if (available) { try { await db('select=id&limit=0'); } catch { available = false; } }
    res.json({ available, designs, minAmount: 500, maxAmount: 50000, ...(available ? { applicationId: env('SQUARE_APPLICATION_ID'), locationId: location(), sandbox: env('SQUARE_ENV') !== 'production' } : {}) });
  });
  router.post('/orders', async (req, res) => {
    if (!ready()) return res.status(503).json({ error: 'Gift card checkout is being prepared. Please check back shortly.' });
    let gift;
    try { gift = validateGift(req.body); } catch (error) { return res.status(400).json({ error: error.message }); }
    const { id, token } = req.body;
    if (!uuidOK(id) || !tokenOK(token)) return res.status(400).json({ error: 'Refresh this page to start a new gift order.' });
    const fingerprint = hash(JSON.stringify(gift));
    try {
      const existing = (await db(`id=eq.${id}&limit=1`))[0];
      if (existing && (existing.token_hash !== hash(token) || existing.fingerprint !== fingerprint)) return res.status(409).json({ error: 'Start a new gift order for these details.' });
      if (!existing) {
        try { await db('', 'POST', { id, token_hash: hash(token), fingerprint, ...gift, location_id: location() }); }
        catch {
          const raced = (await db(`id=eq.${id}&limit=1`))[0];
          if (!raced || raced.token_hash !== hash(token) || raced.fingerprint !== fingerprint) throw new Error('Order unavailable');
        }
      }
      res.json({ id });
    } catch { res.status(503).json({ error: 'Could not prepare your gift order. No payment was requested.' }); }
  });
  router.get('/orders/:id', async (req, res) => {
    try {
      const row = await owned(req);
      if (!row) return res.status(404).json({ error: 'Gift order not found.' });
      res.json({ id: row.id, status: row.status, amount: row.amount, recipientEmail: row.recipient_email, receiptUrl: row.receipt_url || null });
    } catch { res.status(503).json({ error: 'Could not check your gift order. Please try again.' }); }
  });
  router.post('/orders/:id/pay', async (req, res) => {
    if (!ready()) return res.status(503).json({ error: 'Gift card payments are temporarily unavailable.' });
    let row;
    try {
      const existing = await owned(req);
      if (!existing) return res.status(404).json({ error: 'Gift order not found.' });
      if (['sent','paid','attention'].includes(existing.status)) return res.json({ accepted: true });
      if (existing.status === 'payment_failed') return res.status(400).json({ error: 'This payment was declined. Start a new order to use another card.' });
      if (typeof req.body.sourceId !== 'string' || !req.body.sourceId || req.body.sourceId.length > 1000) return res.status(400).json({ error: 'Enter your payment details.' });
      row = await claim(existing.id);
      if (!row) return res.status(202).json({ accepted: true });
      if (!row.square_order_id) {
        const { order } = await square('/orders', { idempotency_key: `gift-order-${row.id}`, order: { location_id: row.location_id, reference_id: row.id, source: { name: 'Chunki Chip Gift Cards' }, line_items: [{ uid: 'gift', name: 'Chunki Chip eGift Card', quantity: '1', item_type: 'GIFT_CARD', base_price_money: { amount: row.amount, currency: 'USD' } }] } });
        await save(row, { square_order_id: order.id });
      }
      const { order } = await square(`/orders/${encodeURIComponent(row.square_order_id)}`);
      if (order.state !== 'COMPLETED') {
        await save(row, { status: 'processing' });
        const { payment } = await square('/payments', { idempotency_key: `gift-payment-${row.id}`, source_id: req.body.sourceId, amount_money: { amount: row.amount, currency: 'USD' }, order_id: row.square_order_id, location_id: row.location_id, autocomplete: true, buyer_email_address: row.buyer_email, reference_id: row.id, note: 'Chunki Chip eGift Card' });
        await save(row, { payment_id: payment.id, receipt_url: payment.receipt_url || null });
        if (payment.status !== 'COMPLETED') return res.status(202).json({ accepted: true });
      }
      await fulfill(row);
      res.json({ accepted: true });
    } catch (error) {
      if (row && error.declined) { await save(row, { status: 'payment_failed' }); return res.status(400).json({ error: 'Your card was declined. Start a new order to try another card.' }); }
      if (row) {
        // The charge might have completed even if the network response was lost.
        await save(row, { next_retry: new Date().toISOString() }).catch(() => {});
        return res.status(202).json({ accepted: true });
      }
      res.status(503).json({ error: 'Could not start the payment. Please try again.' });
    } finally { if (row) await release(row).catch(() => {}); }
  });
  router.retryPendingGiftOrders = work;
  return router;
};
module.exports.validateGift = validateGift;
module.exports.emailBody = emailBody;
