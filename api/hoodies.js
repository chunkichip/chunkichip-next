const express = require('express');
const crypto = require('crypto');
const PRICES = Object.freeze({ XS: 3999, S: 3999, M: 3999, L: 3999, XL: 3999, '2XL': 4999, '3XL': 4999 });
function validate(body = {}) {
  const name = typeof body.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const digits = typeof body.phone === 'string' ? body.phone.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '') : '';
  if (!name || name.length > 100 || !/\p{L}/u.test(name) || /[\r\n]/.test(body.name)) throw new Error('Please enter your pickup name.');
  if (email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) throw new Error('Please enter a valid email address.');
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(digits)) throw new Error('Please enter a valid 10-digit mobile number.');
  if (!Object.hasOwn(PRICES, body.size)) throw new Error('Please choose a hoodie size.');
  if (body.acknowledged !== true) throw new Error('Please confirm you will wait until we contact you before picking up.');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.attemptId || '')) throw new Error('Please refresh and try again.');
  return { name, email, phone: `+1${digits}`, size: body.size, amount: PRICES[body.size], attemptId: body.attemptId };
}
module.exports = function hoodies({ square, configuredLocations }) {
  const router = express.Router(); const limits = new Map();
  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (req.get('origin')) { try { if (new URL(req.get('origin')).host !== req.get('host')) return res.status(403).json({ error: 'Please use the Chunki Chip website.' }); } catch { return res.status(403).json({ error: 'Invalid origin.' }); } }
    const now = Date.now(); for (const [key, bucket] of limits) if (bucket.until < now) limits.delete(key);
    const key = req.socket.remoteAddress || 'unknown'; const bucket = limits.get(key) || { count: 0, until: now + 60000 };
    if (limits.size > 5000 || ++bucket.count > 20) return res.status(429).json({ error: 'Please wait a minute before trying again.' });
    limits.set(key, bucket); next();
  });
  router.post('/checkout', async (req, res) => {
    let chosen; try { chosen = validate(req.body); } catch (error) { return res.status(400).json({ error: error.message }); }
    if (!square) return res.status(503).json({ error: 'Online checkout is temporarily unavailable. Please call (603) 554-8571.' });
    try {
      const location = configuredLocations().find(item => item.id === 'milford');
      if (!location) throw new Error('Milford unavailable');
      const note = `HOODIE · ${chosen.size} · Pickup only at 183 Elm St, Unit 8, Milford. Ready in 1–7 days. WAIT until Chunki Chip contacts you before collecting. Pickup name: ${chosen.name}. Mobile: ${chosen.phone}. Email: ${chosen.email}.`;
      // Merchandise has no cookie food-tax assignments and no scheduled food pickup.
      // Square supplies its default fulfillment; the shop contacts the buyer manually.
      const result = await square.checkout.paymentLinks.create({
        idempotencyKey: crypto.createHash('sha256').update(JSON.stringify(chosen)).digest('hex'),
        order: { locationId: location.squareLocationId, source: { name: 'Chunki Chip Hoodies' }, referenceId: 'Hoodie pickup', ticketName: chosen.name,
          lineItems: [{ name: `Chunki Chip Hoodie · ${chosen.size} · Milford pickup`, quantity: '1', basePriceMoney: { amount: BigInt(chosen.amount), currency: 'USD' }, note }] },
        prePopulatedData: { buyerEmail: chosen.email, buyerPhoneNumber: chosen.phone },
        checkoutOptions: { askForShippingAddress: false, redirectUrl: 'https://chunkichip.com/hoodies/success' },
        description: 'Hoodie pickup · Ready in 1–7 days. Wait for us to contact you.', paymentNote: `Chunki Chip Hoodie · ${chosen.size}. Milford pickup only. Ready in 1–7 days. Please wait until we contact you before collecting.`,
      });
      if (!result.paymentLink?.url) throw new Error('Missing checkout link');
      res.json({ url: result.paymentLink.url });
    } catch (error) {
      const errors = error.errors || error.body?.errors || [];
      console.error('Hoodie checkout failed', JSON.stringify({ status: error.statusCode, errors: errors.map(({ code, field }) => ({ code, field })) }));
      res.status(502).json({ error: 'Could not open secure checkout. Please retry or call (603) 554-8571.' });
    }
  });
  return router;
};
module.exports.validate = validate;
module.exports.PRICES = PRICES;
