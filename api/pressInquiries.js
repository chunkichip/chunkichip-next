const express = require('express');

module.exports = function pressInquiries({ send = fetch } = {}) {
  const router = express.Router();
  const attempts = new Map();
  router.post('/', async (req, res) => {
    const clean = (key, max) => typeof req.body?.[key] === 'string' ? req.body[key].trim().slice(0, max) : '';
    if (clean('website', 200)) return res.json({ ok: true });
    const name = clean('name', 120), email = clean('email', 254), outlet = clean('outlet', 200);
    const deadline = clean('deadline', 100), message = clean('message', 5000);
    if (!name || !outlet || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || /[\r\n]/.test(email)) {
      return res.status(400).json({ error: 'Please include your name, valid email, outlet, and inquiry details.' });
    }
    const now = Date.now(), windowMs = 60 * 60 * 1000;
    for (const [key, value] of attempts) if (now - value.start >= windowMs) attempts.delete(key);
    const ip = req.ip;
    const attempt = attempts.get(ip) || { start: now, count: 0 };
    if (attempt.count >= 5) return res.status(429).json({ error: 'Please try again later or email press@chunkichip.com directly.' });
    attempt.count++; attempts.set(ip, attempt);
    if (!process.env.RESEND_API_KEY || !process.env.GIFT_CARD_EMAIL_FROM) return res.status(503).json({ error: 'Please email press@chunkichip.com directly while the form is unavailable.' });
    try {
      const response = await send('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: process.env.GIFT_CARD_EMAIL_FROM, to: ['press@chunkichip.com'], reply_to: email,
          subject: 'New Chunki Chip press inquiry',
          text: `Name: ${name}\nEmail: ${email}\nOutlet / organization: ${outlet}\nDeadline: ${deadline || 'Not specified'}\n\n${message}` }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok || !(await response.json()).id) throw new Error('Delivery unavailable');
      res.json({ ok: true });
    } catch {
      res.status(503).json({ error: 'Your inquiry could not be confirmed. Please email press@chunkichip.com directly.' });
    }
  });
  return router;
};
