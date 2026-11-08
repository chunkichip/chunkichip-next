const {test} = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const crypto = require('crypto');
const catering = require('../catering');
const {PACKAGES,mapCatalog,pickupSlots,validateSelection} = catering;
function catalog(){return [
 ...['full','mini'].map(kind=>({id:kind,type:'ITEM',presentAtAllLocations:true,itemData:{name:kind==='full'?'Full-Size Cookie Catering':'Chiptinis Catering',variations:PACKAGES.filter(p=>p.kind===kind).map(p=>({id:p.key,presentAtAllLocations:true,itemVariationData:{name:`${p.size} ${p.wrapped?'Wrapped':'Unwrapped'}`,priceMoney:{amount:BigInt(p.price),currency:'USD'}}}))}})),
 {id:'dip-list',type:'MODIFIER_LIST',modifierListData:{name:'Catering Dips',modifiers:['Vanilla Frosting','Chocolate Frosting','Marshmallow Frosting'].map(name=>({id:name,modifierData:{name:`${name} 8 oz`,priceMoney:{amount:400n,currency:'USD'}}}))}}
];}
const location = {status:'ACTIVE',timezone:'America/New_York',businessHours:{periods:['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'].map(dayOfWeek=>({dayOfWeek,startLocalTime:'11:00:00',endLocalTime:'18:00:00'}))}};
const now = Date.parse('2026-11-07T16:00:00Z');
function body(){return {attemptId:crypto.randomUUID(),packageKey:'mini-30',flavors:{'Chunki Chip':10,'M&M':10,'Soft Sugar':10},dips:{'Vanilla Frosting':2},pickupAt:pickupSlots(location,now)[0].at,name:'Test Customer',email:'test@example.com',phone:'6035550101'};}
test('catalog resolves all nine exact packages and optional $4 dips without requiring item association',()=>{
 const menu=mapCatalog(catalog(),'location');assert.equal(menu.filter(p=>p.available).length,9);assert.equal(menu.find(p=>p.key==='mini-90').price,6500);assert.equal(menu.find(p=>p.key==='mini-30').dips.filter(d=>d.id).length,3);
});
test('catalog refuses price mismatch, duplicate matches, archived and location sold-out variations',()=>{
 const data=catalog();data[0].itemData.variations[0].itemVariationData.priceMoney.amount=1n;data[0].itemData.variations[1].itemVariationData.locationOverrides=[{locationId:'location',soldOut:true}];data.push({...data[1],id:'duplicate'});
 const menu=mapCatalog(data,'location');assert.equal(menu.find(p=>p.key==='full-24-unwrapped').available,false);assert.equal(menu.find(p=>p.key==='full-24-wrapped').available,false);assert.equal(menu.find(p=>p.key==='mini-30').available,false);
});
test('pickup slots enforce 48 real hours across DST and Square business hours',()=>{
 const slots=pickupSlots(location,now);assert.ok(slots.length);for(const s of slots){assert.ok(Date.parse(s.at)>=now+48*3600000);assert.ok(s.time>='11:00'&&s.time<'18:00');}assert.equal(pickupSlots({...location,businessHours:{periods:[]}},now).length,0);
 const closed=pickupSlots({...location,businessHours:{periods:[{dayOfWeek:'TUESDAY',startLocalTime:'12:00:00',endLocalTime:'14:00:00'}]}},now);assert.ok(closed.every(s=>new Date(s.at).getUTCDay()===2));
});
test('selection validates exact counts, allowed flavors/dips, unavailable slots, and contact',()=>{
 const menu=mapCatalog(catalog(),'location'),slots=pickupSlots(location,now), b=body();assert.equal(validateSelection(b,menu,slots).dips[0].count,2);
 for(const change of [{flavors:{'Chunki Chip':29}},{flavors:{Fake:30}},{dips:{Fake:1}},{dips:{'Vanilla Frosting':-1}},{dips:{'Vanilla Frosting':13}},{pickupAt:new Date(now).toISOString()},{email:'wrong'},{phone:'123'},{packageKey:'fake'}]) assert.throws(()=>validateSelection({...b,...change},menu,slots));
});
test('scheduled checkout sends catalog prices, flavor notes, dip quantities and retry-stable idempotency',async()=>{
 const calls=[]; const square={locations:{get:async()=>({location})},checkout:{paymentLinks:{create:async payload=>{calls.push(payload);return {paymentLink:{url:'https://square.link/test'}};}}}};
 const app=express();app.use(express.json());app.use('/api/catering',catering({square,configuredLocations:()=>[{id:'milford',squareLocationId:'location'}],searchCatalog:async types=>catalog().filter(o=>types.includes(o.type))}));
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
 try{const base=`http://127.0.0.1:${server.address().port}/api/catering`;const menu=await (await fetch(base+'/menu')).json();const b={...body(),pickupAt:menu.slots[0].at,price:1};
 for(let i=0;i<2;i++){const r=await fetch(base+'/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});assert.equal(r.status,200);}
 assert.equal(calls[0].idempotencyKey,calls[1].idempotencyKey);assert.equal(calls[0].order.fulfillments[0].pickupDetails.scheduleType,'SCHEDULED');assert.equal(calls[0].order.fulfillments[0].pickupDetails.pickupAt,b.pickupAt);assert.equal(calls[0].order.lineItems[0].basePriceMoney,undefined);assert.equal(calls[0].order.lineItems[0].modifiers[0].quantity,'2');assert.match(calls[0].order.lineItems[0].note,/10 M&M/);
 const r=await fetch(base+'/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...b,flavors:{'Chunki Chip':1}})});assert.equal(r.status,400);assert.equal(calls.length,2);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
