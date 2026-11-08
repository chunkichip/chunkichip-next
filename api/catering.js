const express = require('express');
const crypto = require('crypto');
const cateringSchedule = require('./cateringSchedule.json');
const FULL_FLAVORS = ["Chunki Chip","Peanut Butter Cup","Cookies & Cream","Hershey’s Brownie","M&M's","Soft Sugar"];
const MINI_FLAVORS = ['Chunki Chip', 'M&M', 'Soft Sugar'];
const DIP_FLAVORS = ['Vanilla Frosting', 'Chocolate Frosting', 'Marshmallow Frosting'];
const PACKAGES = [
  ...[24,48,72].flatMap(size => [false,true].map(wrapped => ({ key: `full-${size}-${wrapped ? 'wrapped' : 'unwrapped'}`, kind: 'full', size, wrapped, price: size * (wrapped ? 400 : 350), name: `${size} full-size cookies · ${wrapped ? 'wrapped' : 'unwrapped'}` }))),
  ...[[30,2400],[60,4500],[90,6500]].map(([size,price]) => ({ key: `mini-${size}`, kind: 'mini', size, price, wrapped: false, name: `${size} Chiptinis` })),
];
const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const present = (object, location) => !object.isDeleted && !(object.absentAtLocationIds || []).includes(location) && (object.presentAtAllLocations !== false || (object.presentAtLocationIds || []).includes(location));
const soldOut = (variation, location) => (variation.itemVariationData?.locationOverrides || []).some(v => v.locationId === location && v.soldOut === true);
function mapCatalog(objects, location) {
  const items = objects.filter(o => o.type === 'ITEM' && !o.itemData?.isArchived && present(o, location));
  const lists = objects.filter(o => o.type === 'MODIFIER_LIST' && present(o, location));
  return PACKAGES.map(pack => {
    const candidates = [];
    for (const item of items) {
      const title = normalize(item.itemData?.name);
      if (!title.includes('cater') || (pack.kind === 'mini' ? !title.includes('chiptini') : !title.includes('fullsize'))) continue;
      for (const variation of item.itemData.variations || []) {
        const data = variation.itemVariationData || {};
        const name = String(data.name || '');
        if (!new RegExp(`(^|\\D)${pack.size}(\\D|$)`).test(name)) continue;
        if (pack.kind === 'full' && (pack.wrapped ? /unwrapped/i.test(name) || !/wrapped/i.test(name) : !/unwrapped/i.test(name))) continue;
        const override = (data.locationOverrides || []).find(v => v.locationId === location);
        const price = override?.priceMoney || data.priceMoney;
        if (!present(variation, location) || soldOut(variation, location) || data.pricingType === 'VARIABLE_PRICING' || price?.currency !== 'USD' || Number(price.amount) !== pack.price) continue;
        const dips = pack.kind === 'mini' ? DIP_FLAVORS.map(flavor => {
          const matches = lists.filter(l => normalize(l.modifierListData?.name).includes('cateringdip')).flatMap(l => l.modifierListData?.modifiers || []).filter(m => normalize(m.modifierData?.name).includes(normalize(flavor)) && Number(m.modifierData?.priceMoney?.amount) === 400 && m.modifierData?.priceMoney?.currency === 'USD' && present(m, location) && !m.modifierData?.isArchived && !(m.modifierData?.locationOverrides || []).some(o => o.locationId === location && o.soldOut));
          return { name: flavor, price: 400, id: matches.length === 1 ? matches[0].id : null };
        }) : [];
        candidates.push({ ...pack, variationId: variation.id, catalogVersion: variation.version?.toString(), dips });
      }
    }
    return candidates.length === 1 ? { ...candidates[0], available: true } : { ...pack, available: false, dips: DIP_FLAVORS.map(name => ({ name, price: 400, id: null })) };
  });
}
function localParts(date, timezone) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: timezone, year:'numeric',month:'2-digit',day:'2-digit',weekday:'long',hour:'2-digit',minute:'2-digit',hourCycle:'h23' }).formatToParts(date).map(p => [p.type,p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, day: parts.weekday.toUpperCase(), minutes: Number(parts.hour)*60+Number(parts.minute), time: `${parts.hour}:${parts.minute}` };
}
const clock = time => { const [h,m] = String(time).split(':').map(Number); return h*60+m; };
function pickupSlots(location, now = Date.now()) {
  const periods = location.businessHours?.periods || [];
  const timezone = location.timezone || 'America/New_York';
  const slots = [];
  const start = Math.ceil((now + 48*3600000)/1800000)*1800000;
  for (let at = start; at < now + 60*86400000; at += 1800000) {
    const local = localParts(new Date(at), timezone);
    const previousDay = localParts(new Date(at-86400000), timezone).day;
    if (periods.some(p => {
      const open = clock(p.startLocalTime), close = clock(p.endLocalTime);
      return close > open ? p.dayOfWeek === local.day && local.minutes >= open && (location.includeClosing ? local.minutes <= close : local.minutes < close) : (p.dayOfWeek === local.day && local.minutes >= open) || (p.dayOfWeek === previousDay && local.minutes < close);
    })) slots.push({ at: new Date(at).toISOString(), date: local.date, time: local.time });
  }
  return slots;
}
function cateringPickupSlots(now = Date.now()) {
  return pickupSlots({ timezone: cateringSchedule.timezone, includeClosing: true, businessHours: { periods: cateringSchedule.days.map(dayOfWeek => ({ dayOfWeek, startLocalTime: cateringSchedule.start, endLocalTime: cateringSchedule.end })) } }, now);
}
function validateSelection(body, menu, slots) {
  const pack = menu.find(p => p.key === body.packageKey && p.available);
  if (!pack) throw new Error('That package is unavailable. Refresh the menu or request a quote.');
  if (!slots.some(s => s.at === body.pickupAt)) throw new Error('Choose an available pickup time at least 48 hours from now.');
  const flavors = pack.kind === 'mini' ? MINI_FLAVORS : FULL_FLAVORS;
  if (!body.flavors || typeof body.flavors !== 'object' || Array.isArray(body.flavors) || Object.keys(body.flavors).some(k => !flavors.includes(k))) throw new Error('Choose valid cookie flavors.');
  const counts = flavors.map(name => ({ name, count: Number(body.flavors[name] ?? 0) }));
  if (pack.kind === 'mini' && counts.some(f => !Number.isInteger(f.count) || f.count % 10 !== 0)) throw new Error('Choose Chiptini flavors in groups of 10.');
  if (counts.some(f => !Number.isInteger(f.count) || f.count < 0) || counts.reduce((sum,f) => sum+f.count,0) !== pack.size) throw new Error(`Choose exactly ${pack.size} cookies.`);
  const rawDips = body.dips || {};
  if (typeof rawDips !== 'object' || Array.isArray(rawDips) || Object.keys(rawDips).some(k => !DIP_FLAVORS.includes(k))) throw new Error('Choose valid dips.');
  const dips = DIP_FLAVORS.map(name => ({ ...pack.dips.find(d => d.name === name), name, count: Number(rawDips[name] ?? 0) }));
  if (dips.some(d => !Number.isInteger(d.count) || d.count < 0 || d.count > 12 || (d.count && (pack.kind !== 'mini' || !d.id))) || dips.reduce((sum,d) => sum+d.count,0) > 12) throw new Error('Choose up to 12 available 8 oz dips.');
  const name = String(body.name || '').trim(), email = String(body.email || '').trim(), phone = String(body.phone || '').replace(/\D/g,'').replace(/^1(?=\d{10}$)/,'');
  if (!name || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !/^\d{10}$/.test(phone)) throw new Error('Enter your name, email, and a US phone number.');
  if (!/^[0-9a-f-]{36}$/i.test(body.attemptId || '')) throw new Error('Refresh the page before continuing.');
  return { pack, counts, dips: dips.filter(d => d.count), name, email, phone: `+1${phone}` };
}
module.exports = function cateringRouter({ square, configuredLocations, searchCatalog }) {
  const router = express.Router();
  let cached, cacheUntil = 0;
  async function catalog(fresh = false) {
    if (!square) throw new Error('Catering ordering is temporarily unavailable. Please call the shop.');
    if (!fresh && cached && Date.now() < cacheUntil) return cached;
    const location = configuredLocations().find(l => l.id === 'milford');
    if (!location) throw new Error('Milford pickup is temporarily unavailable.');
    const [items, lists, details] = await Promise.all([searchCatalog(['ITEM']), searchCatalog(['MODIFIER_LIST']), square.locations.get({ locationId: location.squareLocationId })]);
    if (details.location?.status !== 'ACTIVE') throw new Error('Milford pickup is temporarily unavailable.');
    cached = { location, details: details.location, packages: mapCatalog([...items,...lists], location.squareLocationId) };
    cacheUntil = Date.now()+60000;
    return cached;
  }
  const limits = new Map();
  function limit(req, res, next) {
    const key = req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    for (const [key,value] of limits) if (value.until < now) limits.delete(key);
    const value = limits.get(key) || { count:0,until:now+60000 }; value.count++; limits.set(key,value);
    if (value.count > 100) return res.status(429).json({ error:'Too many requests. Please try again in a minute.' });
    next();
  }
  router.get('/menu', async (_req,res) => {
    try {
      const data = await catalog();
      res.set('Cache-Control','no-store').json({ packages:data.packages.map(({ variationId,catalogVersion,...p }) => ({ ...p, dips:p.dips.map(({id,...d}) => ({...d,available:Boolean(id)})) })), slots:cateringPickupSlots(), timezone:cateringSchedule.timezone, pickupHours:cateringSchedule.label, flavors:{full:FULL_FLAVORS,mini:MINI_FLAVORS}, location:'Milford', address:data.details.address });
    } catch (error) { res.status(503).json({ error:error.message }); }
  });
  router.post('/checkout', limit, async (req,res) => {
    let data, selection;
    try { data = await catalog(true); selection = validateSelection(req.body || {},data.packages,cateringPickupSlots()); }
    catch (error) { return res.status(400).json({error:error.message}); }
    const {pack,counts,dips,name,email,phone} = selection;
    const notes = `CATERING · ${pack.name}. Flavors: ${counts.filter(f=>f.count).map(f=>`${f.count} ${f.name}`).join(', ')}.${dips.length ? ` Dips (8 oz each): ${dips.map(d=>`${d.count} ${d.name}`).join(', ')}.` : ' No dips.'}`;
    const key = crypto.createHash('sha256').update(JSON.stringify({attempt:req.body.attemptId,pack:pack.key,flavors:counts,dips:dips.map(d=>[d.name,d.count]),at:req.body.pickupAt,name,email,phone})).digest('hex');
    try {
      const result = await square.checkout.paymentLinks.create({ idempotencyKey:key,
        order:{ locationId:data.location.squareLocationId, referenceId:'Website Catering',source:{name:'Online Order'},pricingOptions:{autoApplyTaxes:true},
          lineItems:[{catalogObjectId:pack.variationId,quantity:'1',note:notes, ...(dips.length ? {modifiers:dips.map(d=>({catalogObjectId:d.id,quantity:String(d.count)}))} : {})}],
          fulfillments:[{uid:'catering-pickup',type:'PICKUP',state:'PROPOSED',pickupDetails:{recipient:{displayName:name,emailAddress:email,phoneNumber:phone},scheduleType:'SCHEDULED',pickupAt:req.body.pickupAt,note:notes}}]},
        checkoutOptions:{enableLoyalty:true,askForShippingAddress:false},prePopulatedData:{buyerEmail:email,buyerPhoneNumber:phone},paymentNote:`Catering pickup · ${pack.name}`,description:'Chunki Chip scheduled catering pickup',
      });
      if (!result.paymentLink?.url) throw new Error('Missing checkout URL');
      res.json({url:result.paymentLink.url});
    } catch(error) { console.error('Catering checkout failed',error.errors || error.message); res.status(502).json({error:'Could not open Square checkout. Your payment has not been submitted here. Please try again.'}); }
  });
  router.post('/quote', limit, async (req,res) => {
    const b = req.body || {}, clean = (key,max=200) => String(b[key] || '').trim().slice(0,max);
    if (b.website) return res.json({ok:true});
    const id = clean('id',36), name = clean('name',120), email = clean('email',254), phone = clean('phone',40), eventDate = clean('eventDate',10);
    const today = localParts(new Date(), 'America/New_York').date;
    if (!/^[0-9a-f-]{36}$/i.test(id) || !name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || phone.replace(/\D/g,'').length < 10 || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate) || !Number.isFinite(Date.parse(eventDate)) || eventDate < today || !clean('quantity') || !clean('details',3000)) return res.status(400).json({error:'Add your contact information, event date, quantity, and order details.'});
    const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY, url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!key || !url) return res.status(503).json({error:'Please call (603) 554-8571 to plan your order.'});
    try {
      const response = await fetch(`${url}/rest/v1/catering_requests`,{method:'POST',headers:{apikey:key,...(!key.startsWith('sb_secret_') ? {Authorization:`Bearer ${key}`} : {}),'Content-Type':'application/json',Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify({id,name,email,phone,event_date:eventDate,event_type:clean('eventType'),quantity:clean('quantity'),fulfillment:clean('fulfillment'),details:clean('details',3000)}),signal:AbortSignal.timeout(10000)});
      if (!response.ok) throw new Error(`Quote storage returned ${response.status}`);
      res.json({ok:true,reference:id});
    } catch(error) { console.error('Catering request failed',error.message); res.status(503).json({error:'Your request could not be confirmed. Please try again or call (603) 554-8571.'}); }
  });
  // Read-only catalog diagnostics, no customer data and no orders created.
  router.checkCatalog = async () => { const d = await catalog(true); console.log('Catering catalog:',JSON.stringify({packages:d.packages.map(p=>({key:p.key,available:p.available,dips:p.dips.map(d=>({name:d.name,available:Boolean(d.id)}))})),slots:cateringPickupSlots().length,items:(await searchCatalog(['ITEM'])).filter(i=>/cater/i.test(i.itemData?.name || '')).map(i=>({name:i.itemData.name,variations:i.itemData.variations?.map(v=>({name:v.itemVariationData?.name,price:String(v.itemVariationData?.priceMoney?.amount)}))}))})); };
  return router;
};
module.exports.mapCatalog = mapCatalog;
module.exports.pickupSlots = pickupSlots;
module.exports.validateSelection = validateSelection;
module.exports.PACKAGES = PACKAGES;

module.exports.cateringPickupSlots = cateringPickupSlots;
