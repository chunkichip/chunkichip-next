const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const press = require('../pressInquiries');

test('press form validates requests, routes to fixed inbox, and reports delivery failures', async () => {
  process.env.RESEND_API_KEY = 'test-key'; process.env.GIFT_CARD_EMAIL_FROM = 'Chunki Chip <hello@chunkichip.com>';
  let payload, calls = 0, fail = false;
  const app = express(); app.use(express.json());
  app.use('/press', press({ send: async (_url, request) => { calls++; payload = JSON.parse(request.body); return { ok: !fail, json: async () => ({ id: 'email-test' }) }; } }));
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  const post = body => fetch(`http://127.0.0.1:${server.address().port}/press`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    assert.equal((await post({})).status, 400); assert.equal(calls, 0);
    const data = { name: 'Reporter', email: 'reporter@example.com', outlet: 'Local News', message: 'Interview request', deadline: '2026-12-01', to: 'other@example.com' };
    assert.equal((await post(data)).status, 200);
    assert.deepEqual(payload.to, ['press@chunkichip.com']); assert.equal(payload.reply_to, data.email); assert.match(payload.text, /Local News/);
    fail = true; assert.equal((await post(data)).status, 503);
    await post({ ...data, website: 'spam' }); assert.equal(calls, 2);
    fail = false; await post(data); await post(data); await post(data);
    assert.equal((await post(data)).status, 429);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
