const express = require('express');
const { closedDates } = require('./cateringSchedule.json');
const PREP_MINUTES = 15;
const ADVANCE_DAYS = 14;
const STEP = 15 * 60000;
const weekdays = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
const clock = value => { const [h,m] = String(value || '').split(':').map(Number); return h * 60 + m; };

function pickupSlots(location, now = Date.now()) {
  if (location.status !== 'ACTIVE') return [];
  const timezone = location.timezone || 'America/New_York';
  const format = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year:'numeric',month:'2-digit',day:'2-digit',weekday:'long',hour:'2-digit',minute:'2-digit',hourCycle:'h23' });
  const closures = new Set(location.closedDates || closedDates);
  const slots = [];
  for (let at = Math.ceil((now + PREP_MINUTES * 60000) / STEP) * STEP; at < now + ADVANCE_DAYS * 86400000; at += STEP) {
    const parts = Object.fromEntries(format.formatToParts(new Date(at)).map(p => [p.type,p.value]));
    const date = `${parts.year}-${parts.month}-${parts.day}`;
    if (closures.has(date)) continue;
    const day = parts.weekday.toUpperCase(), minutes = Number(parts.hour) * 60 + Number(parts.minute);
    const previousDay = weekdays[(weekdays.indexOf(day) + 6) % 7];
    const previousDate = new Date(Date.UTC(Number(parts.year), Number(parts.month)-1, Number(parts.day)-1)).toISOString().slice(0,10);
    const open = (location.businessHours?.periods || []).some(period => {
      const start = clock(period.startLocalTime), end = clock(period.endLocalTime);
      if (!Number.isFinite(start) || !Number.isFinite(end) || start === end) return false;
      return end > start
        ? period.dayOfWeek === day && minutes >= start && minutes < end
        : (period.dayOfWeek === day && minutes >= start) || (period.dayOfWeek === previousDay && !closures.has(previousDate) && minutes < end);
    });
    if (open) slots.push({ at: new Date(at).toISOString(), date, time: `${parts.hour}:${parts.minute}` });
  }
  return slots;
}

module.exports = function pickupRouter({ square, configuredLocations }) {
  const router = express.Router();
  const cache = new Map();
  async function options(location) {
    if (!square || !location) throw new Error('Pickup scheduling is temporarily unavailable. Please try again.');
    let cached = cache.get(location.squareLocationId);
    if (!cached || cached.until <= Date.now()) {
      const result = await square.locations.get({ locationId: location.squareLocationId });
      if (!result.location) throw new Error('Pickup scheduling is temporarily unavailable. Please try again.');
      cached = { location: result.location, until: Date.now() + 60000 };
      cache.set(location.squareLocationId, cached);
    }
    const timezone = cached.location.timezone || 'America/New_York';
    return { locationId: location.id, locationName: location.name, timezone, advanceDays: ADVANCE_DAYS, prepMinutes: PREP_MINUTES, slots: pickupSlots(cached.location) };
  }
  router.get('/', async (req, res) => {
    res.set('Cache-Control','no-store');
    const locations = configuredLocations();
    const location = req.query.locationId ? locations.find(l => l.id === req.query.locationId) : locations[0];
    if (!location) return res.status(400).json({ error: 'Choose an available pickup location.' });
    try { res.json({ ...(await options(location)), locations: locations.map(({ id, name }) => ({ id, name })) }); }
    catch { res.status(503).json({ error: 'Pickup times could not load. Please retry or call the shop.' }); }
  });
  router.selection = async (location, pickupAt) => {
    if (typeof pickupAt !== 'string') { const error = new Error('Choose a pickup date and time before continuing. Refresh your bag if the time selector is missing.'); error.status = 400; throw error; }
    const menu = await options(location);
    const slot = menu.slots.find(s => s.at === pickupAt);
    if (!slot) { const error = new Error('That pickup time is no longer available. Choose a fresh date and time.'); error.status = 400; throw error; }
    const label = new Intl.DateTimeFormat('en-US',{timeZone:menu.timezone,weekday:'long',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(new Date(slot.at));
    return { pickupAt: slot.at, timezone: menu.timezone, label, scheduleType: 'SCHEDULED', prepTimeDuration: `PT${PREP_MINUTES}M` };
  };
  return router;
};
module.exports.pickupSlots = pickupSlots;
