const express = require('express');
const crypto = require('crypto');
const FLAVORS = ['Chunki Chip', 'Hershey’s Brownie', 'Golden Oreo Birthday Cake', 'Peanut Butter Cup', 'Cookies & Cream'];
const DEADLINE = Date.parse('2026-11-24T00:00:00-05:00');
const START = Date.parse('2026-11-25T10:00:00-05:00');
const END = Date.parse('2026-11-25T19:00:00-05:00');
const slots = Array.from({length:19}, (_, i) => new Date(START + i * 30 * 60000).toISOString());
function validate(body, now = Date.now()) {
  if (now >= DEADLINE) throw new Error('Thanksgiving preorders are closed.');
  if (!slots.includes(body.pickupAt)) throw new Error('Choose Wednesday, November 25, between 10 AM and 7 PM.');
  const quantities = body.flavors;
  if (!quantities || Array.isArray(quantities) || typeof quantities !== 'object' || Object.keys(quantities).some(name => !FLAVORS.includes(name))) throw new Error('Choose from the five platter flavors.');
  const counts = FLAVORS.map(name => ({name, count:quantities[name] ?? 0}));
  if (counts.some(f => typeof f.count !== 'number' || !Number.isInteger(f.count) || f.count < 0 || f.count > 16 || f.count % 4) || counts.reduce((n,f) => n+f.count,0) !== 16) throw new Error('Choose 16 cookies in groups of four.');
  const name = typeof body.name === 'string' ? body.name.trim().replace(/\s+/g,' ') : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const digits = typeof body.phone === 'string' ? body.phone.replace(/\D/g,'').replace(/^1(?=\d{10}$)/,'') : '';
  if (!name || name.length > 100 || !/\p{L}/u.test(name) || email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) || !/^\d{10}$/.test(digits)) throw new Error('Enter your name, email, and a valid US phone number.');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.attemptId || '')) throw new Error('Refresh the page and try again.');
  return {counts:counts.filter(f=>f.count),name,email,phone:'+1'+digits,pickupAt:body.pickupAt};
}
module.exports = function thanksgiving({square,configuredLocations,searchCatalog,now=Date.now}) {
  const router=express.Router();const limits=new Map();
  router.get('/menu',(_req,res)=>res.set('Cache-Control','no-store').json({open:now()<DEADLINE,price:6500,size:16,flavors:FLAVORS,slots,deadline:'2026-11-24T00:00:00-05:00'}));
  router.post('/checkout',async(req,res)=>{
    let chosen;
    try {chosen=validate(req.body || {},now());}catch(e){return res.status(400).json({error:e.message});}
    const time=now();for(const [k,v] of limits)if(v.until<time)limits.delete(k);
    const key=req.socket.remoteAddress || 'unknown';const rate=limits.get(key)||{until:time+60000,count:0};limits.set(key,rate);
    if(++rate.count>20)return res.status(429).json({error:'Please wait a minute before trying again.'});
    if(!square)return res.status(503).json({error:'Online ordering is temporarily unavailable. Please call the shop.'});
    try {
      const location=configuredLocations().find(l=>l.id==='milford');if(!location)throw new Error('Milford unavailable');
      const [catalog,details]=await Promise.all([searchCatalog(['ITEM']),square.locations.get({locationId:location.squareLocationId})]);
      if(details.location?.status!=='ACTIVE')throw new Error('Milford unavailable');
      // Use the same catalog tax assignments as the shop's standard cookie boxes.
      const donor=catalog.find(item=>!item.isDeleted && !item.itemData?.isArchived && /^\d+\s+cookie\s+box$/i.test(item.itemData?.name || '') && !(item.absentAtLocationIds || []).includes(location.squareLocationId) && (item.presentAtAllLocations!==false || (item.presentAtLocationIds || []).includes(location.squareLocationId)));
      if(!donor)throw new Error('Cookie catalog unavailable');
      const notes=`CATERING · 16 Thanksgiving cookies. Flavors: ${chosen.counts.map(f=>`${f.count} ${f.name}`).join(', ')}. Thanksgiving platter, red ribbon and sticker. Pickup Wednesday November 25.`;
      const taxes=(donor.itemData.taxIds || []).map(id=>({uid:id,catalogObjectId:id,scope:'ORDER'}));
      const idempotencyKey=crypto.createHash('sha256').update(JSON.stringify({attempt:req.body.attemptId,...chosen})).digest('hex');
      // Square populates buyer contacts from the pickup recipient; buyerEmail conflicts with fulfillments.
      const result=await square.checkout.paymentLinks.create({idempotencyKey,
        order:{locationId:location.squareLocationId,source:{name:'Online Order'},referenceId:'Thanksgiving 2026',ticketName:chosen.name,
          lineItems:[{name:'Thanksgiving Cookie Platter · 16 cookies',quantity:'1',basePriceMoney:{amount:6500n,currency:'USD'},note:notes}],
          ...(taxes.length?{taxes}:{}),fulfillments:[{uid:'thanksgiving-pickup',type:'PICKUP',state:'PROPOSED',pickupDetails:{recipient:{displayName:chosen.name,emailAddress:chosen.email,phoneNumber:chosen.phone},scheduleType:'SCHEDULED',pickupAt:chosen.pickupAt,note:notes}}]},
        checkoutOptions:{enableLoyalty:true,askForShippingAddress:false,redirectUrl:'https://chunkichip.com/success'},description:'Thanksgiving platter · Wednesday November 25 pickup',paymentNote:notes});
      if(!result.paymentLink?.url)throw new Error('Missing checkout URL');res.json({url:result.paymentLink.url});
    }catch(e){
      // Log Square's validation codes and fields without customer contact data.
      const errors=e.errors || e.body?.errors || [];
      console.error('Thanksgiving checkout failed:',JSON.stringify({status:e.statusCode,errors:errors.map(({code,field})=>({code,field})),message:errors.length?undefined:e.message}));
      res.status(502).json({error:'Could not open checkout. Please retry or call (603) 554-8571.'});
    }
  });return router;
};
module.exports.validate=validate;module.exports.slots=slots;module.exports.DEADLINE=DEADLINE;
