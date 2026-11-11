const {test} = require('node:test');
const assert = require('node:assert/strict');
const {pickupSlots} = require('../pickup');
const schedule = require('../pickupSchedule.json').milford;
const allDays = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
const shop = {status:'ACTIVE',timezone:'America/New_York',businessHours:{periods:allDays.filter(d=>d!=='MONDAY').map(dayOfWeek=>({dayOfWeek,startLocalTime:'11:00:00',endLocalTime:'17:00:00'}))}};
test('pickup times enforce shop hours, 15-minute lead, 14-day horizon, and closures',()=>{
 const now = Date.parse('2026-11-24T21:42:00Z');
 const slots = pickupSlots(shop,now);
 assert.ok(slots.length);
 assert.equal(slots[0].at,'2026-11-25T16:00:00.000Z');
 for(const s of slots){
  assert.ok(Date.parse(s.at)>=now+15*60000);
  assert.ok(Date.parse(s.at)<now+14*86400000);
  assert.ok(s.time>='11:00'&&s.time<='16:50');
  assert.ok(!['2026-11-26','2026-11-27','2026-11-30','2026-12-07'].includes(s.date));
 }
 const christmas=pickupSlots(shop,Date.parse('2026-12-24T16:00:00Z'));
 assert.ok(christmas.every(s=>!['2026-12-25','2026-12-26'].includes(s.date)));
 assert.equal(pickupSlots({...shop,status:'INACTIVE'},now).length,0);
 assert.equal(pickupSlots({...shop,businessHours:{periods:[]}},now).length,0);
 assert.ok(slots.some(s=>s.date==='2026-11-25'&&s.time==='11:00'));
 assert.ok(slots.some(s=>s.date==='2026-11-25'&&s.time==='16:50'));
 assert.ok(!slots.some(s=>s.time==='16:55'));
});
test('slot UTC offsets follow Eastern daylight-saving changes',()=>{
 const slots=pickupSlots(shop,Date.parse('2027-03-12T16:00:00Z'));
 assert.equal(slots.find(s=>s.date==='2027-03-13'&&s.time==='11:00').at,'2027-03-13T16:00:00.000Z');
 assert.equal(slots.find(s=>s.date==='2027-03-14'&&s.time==='11:00').at,'2027-03-14T15:00:00.000Z');
});
test('overnight hours respect the previous day and a closed holiday',()=>{
 const overnight={...shop,businessHours:{periods:[{dayOfWeek:'WEDNESDAY',startLocalTime:'22:00:00',endLocalTime:'02:00:00'}]}};
 const slots=pickupSlots(overnight,Date.parse('2026-11-25T04:00:00Z'));
 assert.ok(slots.some(s=>s.date==='2026-11-25'&&s.time==='22:00'));
 assert.ok(!slots.some(s=>s.date==='2026-11-26'));
 assert.ok(slots.some(s=>s.date==='2026-12-03'&&s.time==='01:45'));
 assert.ok(slots.some(s=>s.date==='2026-12-03'&&s.time==='01:50'));
 assert.ok(!slots.some(s=>s.date==='2026-12-03'&&s.time==='01:55'));
 assert.ok(!slots.some(s=>s.date==='2026-12-03'&&s.time==='02:00'));
});
test('midnight closing allows the final pickup at 11:50pm on the preceding day',()=>{
 const midnight={...shop,businessHours:{periods:[{dayOfWeek:'WEDNESDAY',startLocalTime:'11:00:00',endLocalTime:'00:00:00'}]}};
 const slots=pickupSlots(midnight,Date.parse('2026-12-02T16:00:00Z'));
 assert.ok(slots.some(s=>s.date==='2026-12-02'&&s.time==='23:50'));
 assert.ok(!slots.some(s=>s.date==='2026-12-02'&&s.time==='23:55'));
 assert.ok(!slots.some(s=>s.date==='2026-12-03'&&s.time==='00:00'));
});
test('approved Milford hours close Monday/Tuesday and end pickup ten minutes before close',()=>{
 const slots=pickupSlots({status:'ACTIVE',...schedule},Date.parse('2026-11-10T12:00:00Z'));
 const format=new Intl.DateTimeFormat('en-US',{timeZone:schedule.timezone,weekday:'long'});
 const groups = new Map();
 for(const slot of slots){
  const day=format.format(new Date(slot.at));
  assert.ok(!['Monday','Tuesday'].includes(day));
  const closing=['Wednesday','Sunday'].includes(day)?'16:50':'18:50';
  assert.ok(slot.time>='11:00' && slot.time<=closing);
  if(!groups.has(slot.date))groups.set(slot.date,[]);
  groups.get(slot.date).push(slot.time);
 }
 for(const [date,times] of groups){
  const day=format.format(new Date(date+'T17:00:00Z'));
  assert.equal(times[0],'11:00');
  assert.equal(times.at(-1),['Wednesday','Sunday'].includes(day)?'16:50':'18:50');
 }
});
