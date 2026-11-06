const express = require('express');
const crypto = require('crypto');

module.exports = function customerBenefits() {
  const router = express.Router();
  const sessions = new Map();
  const limits = new Map();
  const cookieName = 'chunki_rewards';
  const portal = 'https://profile.squareup.com/merchantportal/MLGF722JEEMCW/loyalty';
  const verificationReady = () => Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_VERIFY_SERVICE_SID);

  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  function limit(key, maximum) {
    const now = Date.now();
    for (const [id, value] of limits) if (value.until <= now) limits.delete(id);
    if (!limits.has(key)) {
      if (limits.size >= 5000) return false;
      limits.set(key, { count: 0, until: now + 600000 });
    }
    const bucket = limits.get(key);
    bucket.count += 1;
    return bucket.count <= maximum;
  }

  function protect(req, res, next) {
    const origin = req.get('origin');
    if (origin) {
      const allowed = (process.env.CORS_ORIGIN || '').split(',').map(value => value.trim());
      try {
        if (new URL(origin).host !== req.get('host') && !allowed.includes(origin)) {
          return res.status(403).json({ error: 'Please use the Chunki Chip website.' });
        }
      } catch {
        return res.status(403).json({ error: 'Invalid request origin.' });
      }
    }
    if (!limit(`request:${req.ip}`, 100)) return res.status(429).json({ error: 'Please wait a few minutes before trying again.' });
    next();
  }

  function phoneNumber(value) {
    const digits = String(value || '').replace(/\D/g, '');
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
    return null;
  }

  async function square(path, body) {
    if (!process.env.SQUARE_ACCESS_TOKEN) throw new Error('Square unavailable');
    const host = process.env.SQUARE_ENV === 'production' ? 'https://connect.squareup.com' : 'https://connect.squareupsandbox.com';
    const response = await fetch(`${host}/v2${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
        'Square-Version': '2026-09-16',
        'Content-Type': 'application/json',
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(12000),
    });
    const result = await response.json();
    if (!response.ok || result.errors?.length) throw new Error('Square request failed');
    return result;
  }

  async function verify(path, fields) {
    const service = encodeURIComponent(process.env.TWILIO_VERIFY_SERVICE_SID);
    const response = await fetch(`https://verify.twilio.com/v2/Services/${service}/${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(fields),
      signal: AbortSignal.timeout(12000),
    });
    const result = await response.json();
    if (!response.ok) throw new Error('Verification unavailable');
    return result;
  }

  function session(req) {
    const token = (req.get('cookie') || '').split(';').map(value => value.trim()).find(value => value.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
    const value = token ? sessions.get(token) : null;
    if (!value || value.until <= Date.now()) return null;
    return value;
  }

  router.get('/rewards/program', async (_req, res) => {
    try {
      const { program } = await square('/loyalty/programs/main');
      const rules = (program.accrual_rules || []).map(rule => {
        const points = `${rule.points} ${rule.points === 1 ? 'point' : 'points'}`;
        if (rule.type === 'SPEND') {
          const amount = Number(rule.spend_data?.amount_money?.amount || 0) / 100;
          return `Earn ${points} for every $${amount.toFixed(2)} in eligible purchases.`;
        }
        if (rule.type === 'VISIT') return `Earn ${points} per qualifying visit.`;
        return `Earn ${points} on qualifying items.`;
      });
      res.json({
        phoneSignInAvailable: verificationReady(),
        portal,
        pointName: program.terminology?.other || 'points',
        rules,
        tiers: (program.reward_tiers || []).map(tier => ({ id: tier.id, name: tier.name, points: tier.points })),
      });
    } catch {
      res.status(503).json({ error: 'Rewards details are temporarily unavailable. Please try again shortly.', portal });
    }
  });

  router.post('/rewards/send-code', protect, async (req, res) => {
    if (!verificationReady()) return res.status(503).json({ error: 'Phone sign-in is coming soon. You can access your rewards through Square below.' });
    const phone = phoneNumber(req.body.phone);
    if (!phone) return res.status(400).json({ error: 'Enter a valid US phone number.' });
    const key = crypto.createHash('sha256').update(phone).digest('hex');
    if (!limit(`send:${key}`, 3) || !limit(`send-ip:${req.ip}`, 20)) return res.status(429).json({ error: 'Please wait before requesting another code.' });
    try {
      await verify('Verifications', { To: phone, Channel: 'sms' });
      res.json({ sent: true });
    } catch {
      res.status(503).json({ error: 'We could not send a code. Please try again shortly.' });
    }
  });

  router.post('/rewards/verify-code', protect, async (req, res) => {
    const phone = phoneNumber(req.body.phone);
    const code = String(req.body.code || '').trim();
    if (!verificationReady()) return res.status(503).json({ error: 'Phone sign-in is coming soon.' });
    if (!phone || !/^\d{4,10}$/.test(code)) return res.status(400).json({ error: 'Enter the code from your text message.' });
    if (!limit(`verify:${phone}`, 10)) return res.status(429).json({ error: 'Too many attempts. Please wait before trying again.' });
    try {
      const result = await verify('VerificationCheck', { To: phone, Code: code });
      if (result.status !== 'approved') return res.status(400).json({ error: 'That code is invalid or expired. Please try again.' });
      for (const [id, value] of sessions) if (value.until <= Date.now()) sessions.delete(id);
      if (sessions.size >= 5000) return res.status(503).json({ error: 'Please try again shortly.' });
      const token = crypto.randomBytes(32).toString('hex');
      sessions.set(token, { phone, until: Date.now() + 1800000 });
      res.cookie(cookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 1800000, path: '/api/benefits/rewards' });
      res.json({ verified: true });
    } catch {
      res.status(400).json({ error: 'That code is invalid or expired. Request a new code and try again.' });
    }
  });

  router.get('/rewards/account', protect, async (req, res) => {
    const user = session(req);
    if (!user) return res.status(401).json({ error: 'Sign in with your phone number to view your rewards.' });
    try {
      const result = await square('/loyalty/accounts/search', { query: { mappings: [{ phone_number: user.phone }] }, limit: 1 });
      const account = result.loyalty_accounts?.[0];
      res.json({ enrolled: Boolean(account), balance: account?.balance || 0, lifetimePoints: account?.lifetime_points || 0, phoneEnding: user.phone.slice(-4) });
    } catch {
      res.status(503).json({ error: 'We could not load your points. Please try again.' });
    }
  });

  router.post('/rewards/enroll', protect, async (req, res) => {
    const user = session(req);
    if (!user) return res.status(401).json({ error: 'Verify your phone number first.' });
    if (req.body.consent !== true) return res.status(400).json({ error: 'Please agree to join the rewards program.' });
    try {
      const { program } = await square('/loyalty/programs/main');
      const existing = await square('/loyalty/accounts/search', { query: { mappings: [{ phone_number: user.phone }] }, limit: 1 });
      if (!existing.loyalty_accounts?.length) {
        await square('/loyalty/accounts', {
          idempotency_key: crypto.createHash('sha256').update(`chunki-enrollment:${program.id}:${user.phone}`).digest('hex'),
          loyalty_account: { program_id: program.id, mapping: { phone_number: user.phone } },
        });
      }
      res.json({ enrolled: true });
    } catch {
      res.status(503).json({ error: 'We could not enroll you. Please try again shortly.' });
    }
  });

  router.post('/rewards/sign-out', protect, (req, res) => {
    const cookie = (req.get('cookie') || '').split(';').map(value => value.trim()).find(value => value.startsWith(`${cookieName}=`));
    if (cookie) sessions.delete(cookie.slice(cookieName.length + 1));
    res.clearCookie(cookieName, { path: '/api/benefits/rewards', httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
    res.json({ signedOut: true });
  });

  router.post('/gift-cards/balance', protect, async (req, res) => {
    const gan = String(req.body.number || '').replace(/[\s-]/g, '');
    if (!/^\d{16}$/.test(gan)) return res.status(400).json({ error: 'Enter the 16-digit number on your Square gift card.' });
    if (!limit(`gift:${req.ip}`, 10)) return res.status(429).json({ error: 'Please wait a few minutes before checking again.' });
    try {
      const { gift_card: card } = await square('/gift-cards/from-gan', { gan });
      if (!card) throw new Error('Card unavailable');
      res.json({ lastFour: gan.slice(-4), amount: Number(card.balance_money?.amount || 0), currency: card.balance_money?.currency || 'USD', state: card.state });
    } catch {
      res.status(400).json({ error: 'We could not check this card. Confirm the number and try again, or contact the shop.' });
    }
  });

  return router;
};
