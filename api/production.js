const express = require('express');
const crypto = require('crypto');
const {dateKey,flavor,positive,boxSize,analyzeOrder,buildPlan,shiftDay} = require('./productionEngine');
const env=key=>(process.env[key] || '').trim();
const validDay=value=>typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0,10)===value;
async function db(table,query='',method='GET',body) {
 const key=env('SUPABASE_SECRET_KEY') || env('SUPABASE_SERVICE_ROLE_KEY');
 const response=await fetch(`${env('NEXT_PUBLIC_SUPABASE_URL')}/rest/v1/production_${table}?${query}`,{method,headers:{apikey:key,...(key.startsWith('sb_secret_')?{}:{Authorization:`Bearer ${key}`}), 'Content-Type':'application/json',Prefer:'return=representation,resolution=merge-duplicates'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});
 if(!response.ok) throw new Error('Production storage is unavailable.');
 return response.json();
}
async function allRows(table,query) {
 const out=[];
 for(let offset=0;offset<50000;offset+=500){const rows=await db(table,`${query}&limit=500&offset=${offset}`);out.push(...rows);if(rows.length<500)return out;}
 throw new Error('Too many production records for this date range.');
}
async function square(path,body) {
 const host=env('SQUARE_ENV')==='production'?'https://connect.squareup.com':'https://connect.squareupsandbox.com';
 const response=await fetch(`${host}/v2${path}`,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${env('SQUARE_ACCESS_TOKEN')}`,'Content-Type':'application/json','Square-Version':'2026-09-16'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});
 const data=await response.json();
 if(!response.ok || data.errors?.length) throw new Error(`Square order import failed (${data.errors?.[0]?.code || response.status}).`);
 return data;
}
module.exports=function production({configuredLocations,searchCatalog,verifyUser,store=db,squareRequest=square}) {
 const router=express.Router();const activeSync=new Set();
 router.use(async(req,res,next)=>{
  res.set('Cache-Control','no-store');res.set('X-Robots-Tag','noindex');
  const token=req.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if(!token)return res.status(401).json({error:'Sign in to the site manager.'});
  try {
   let user;
   if(verifyUser)user=await verifyUser(token);
   else {
    const response=await fetch(`${env('NEXT_PUBLIC_SUPABASE_URL')}/auth/v1/user`,{headers:{apikey:env('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(10000)});
    if(!response.ok)return res.status(401).json({error:'Please sign in again.'});user=await response.json();
   }
   if(user?.app_metadata?.site_admin!==true)return res.status(403).json({error:'Owner access required.'});
   req.productionUser=user.id;next();
  }catch{return res.status(503).json({error:'Could not verify owner access.'});}
 });
 const readAll=(table,query)=>store===db?allRows(table,query):store(table,query);
 router.get('/',async(req,res)=>{
  try {
   const locations=configuredLocations();const location=locations.find(l=>l.id===(req.query.location || 'milford'));
   const date=req.query.date || dateKey(Date.now());
   if(!location || !validDay(date))return res.status(400).json({error:'Choose a valid location and date.'});
   const today=dateKey(Date.now()),from=shiftDay(date,-56),lid=encodeURIComponent(location.squareLocationId);
   const [flavors,orders,events,runs,reviews]=await Promise.all([store('flavors','select=*&order=kind,name'),readAll('orders',`select=*&location_id=eq.${lid}&business_date=gte.${from}&business_date=lte.${date}&order=id`),readAll('events',`select=*&location_id=eq.${lid}&business_date=eq.${date}&order=created_at,id`),store('syncs',`select=*&location_id=eq.${lid}&order=finished_at.desc&limit=1`),readAll('reviews',`select=*&location_id=eq.${lid}&business_date=gte.${from}&business_date=lte.${date}&order=id`)]);
   for(const order of orders){const review=reviews.find(r=>r.order_id===order.id && r.order_version===order.version);if(review){order.counts=review.counts;order.issues=[];}}
   const historyFrom=runs[0]?.history_from || null;
   res.json({...buildPlan({flavors,orders,events,date,today,historyFrom}),locations:locations.map(({id,name})=>({id,name})),location:location.id,lastSync:runs[0] || null,recentOrders:orders.filter(o=>o.business_date===date).sort((a,b)=>b.issues.length-a.issues.length).slice(0,100).map(o=>({id:o.id,version:o.version,ticket:o.ticket,paid:o.paid,state:o.state,counts:o.counts,issues:o.issues})),events});
  }catch(error){res.status(503).json({error:error.message});}
 });
 router.post('/events',async(req,res)=>{
  try {
   const {location:locationKey,date,flavorId,kind,quantity,note,id}=req.body || {};
   const location=configuredLocations().find(l=>l.id===locationKey);
   const n=Number(quantity); const signed=kind==='adjustment';
   if(!location || !validDay(date) || !['opening','bake','waste','adjustment','target','manual_sale'].includes(kind) || typeof quantity!=='number' || !Number.isSafeInteger(n) || Math.abs(n)>100000 || (!signed && n<0) || !/^[a-f0-9]{24}$/.test(flavorId || '') || !/^[a-f0-9-]{36}$/i.test(id || ''))return res.status(400).json({error:'Check the date, flavor and whole-cookie quantity.'});
   if(!(await store('flavors',`id=eq.${flavorId}&limit=1`)).length)return res.status(400).json({error:'Choose a known flavor.'});
   const existing=await store('events',`id=eq.${id}&limit=1`);
   if(existing.length){const row=existing[0];if(row.location_id!==location.squareLocationId || row.business_date!==date || row.flavor_id!==flavorId || row.kind!==kind || row.quantity!==n || row.note!==String(note||'').trim().slice(0,300))return res.status(409).json({error:'This entry was already saved with different values. Check history before recording a correction.'});return res.json({saved:true});}
   await store('events','','POST',{id,location_id:location.squareLocationId,business_date:date,flavor_id:flavorId,kind,quantity:n,note:String(note||'').trim().slice(0,300),created_by:req.productionUser});
   res.json({saved:true});
  }catch(error){res.status(503).json({error:error.message});}
 });
 router.post('/resolve',async(req,res)=>{
  try {
   const {orderId,version,counts,note}=req.body || {};
   if(typeof orderId!=='string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(orderId) || !Number.isInteger(version) || !Array.isArray(counts) || counts.length>300 || String(note || '').trim().length<5 || String(note).length>300)return res.status(400).json({error:'Enter the whole order breakdown and a review note.'});
   const order=(await store('orders',`id=eq.${encodeURIComponent(orderId)}&limit=1`))[0];
   if(!order || order.version!==version)return res.status(409).json({error:'The order changed. Refresh sales before reviewing it.'});
   const flavors=await store('flavors','select=*');const seen=new Set();const clean=[];
   for(const entry of counts){const f=flavors.find(f=>f.id===entry.id);if(!f || !positive(entry.quantity) || seen.has(f.id))return res.status(400).json({error:'Choose known flavors with positive whole-cookie quantities.'});seen.add(f.id);clean.push({id:f.id,name:f.name,kind:f.kind,quantity:positive(entry.quantity)});}
   await store('reviews','','POST',{id:`${orderId}:${version}`,order_id:orderId,order_version:version,location_id:order.location_id,business_date:order.business_date,counts:clean,note:String(note).trim(),created_by:req.productionUser,updated_at:new Date().toISOString()});
   res.json({saved:true});
  }catch(error){res.status(503).json({error:error.message});}
 });
 router.post('/flavors',async(req,res)=>{
  const name=String(req.body?.name || '').trim(),kind=req.body?.kind;
  if(name.length<2 || name.length>100 || !/[a-z0-9]/i.test(name) || !['full','mini'].includes(kind))return res.status(400).json({error:'Enter a flavor name and cookie size.'});
  try {await store('flavors','','POST',flavor(name,kind));res.json({saved:true});}catch(error){res.status(503).json({error:error.message});}
 });
 router.post('/sync',async(req,res)=>{
  const location=configuredLocations().find(l=>l.id===req.body?.location);
  if(!location)return res.status(400).json({error:'Choose a configured Square location.'});
  if(activeSync.has(location.id))return res.status(409).json({error:'An import is already running for this shop.'});
  activeSync.add(location.id);
  try {
   const days=req.body?.history===true?56:3;
   const until=new Date().toISOString(),since=new Date(Date.now()-days*86400000).toISOString();
   const [items,lists,existing,previous]=await Promise.all([searchCatalog(['ITEM']),searchCatalog(['MODIFIER_LIST']),store('flavors','select=*'),store('syncs',`location_id=eq.${encodeURIComponent(location.squareLocationId)}&order=finished_at.desc&limit=1`)]);
   const known=new Map(existing.map(f=>[f.id,f]));const listMap=new Map(lists.map(l=>[l.id,l]));
   for(const item of items.filter(i=>i.itemData && !i.itemData.isArchived && boxSize(i.itemData.name)))for(const ref of item.itemData.modifierListInfo || [])if(ref.enabled!==false)for(const m of listMap.get(ref.modifierListId)?.modifierListData?.modifiers || [])if(m.modifierData?.name && !m.modifierData.isArchived){const f=flavor(m.modifierData.name);known.set(f.id,f);}
   let cursor,processed=0;const summaries=[];
   for(let page=0;page<40;page++){
    const data=await squareRequest('/orders/search',{location_ids:[location.squareLocationId],limit:500,return_entries:false,...(cursor?{cursor}:{}),query:{filter:{date_time_filter:{updated_at:{start_at:since,end_at:until}}},sort:{sort_field:'UPDATED_AT',sort_order:'ASC'}}});
    for(const order of data.orders || []) {const result=analyzeOrder(order,[...known.values()]);summaries.push(result);for(const f of result.counts)known.set(f.id,{id:f.id,name:f.name,kind:f.kind});processed++;}
    cursor=data.cursor;if(!cursor)break;
   }
   if(cursor)throw new Error('Import exceeded its safe page limit. No order totals were saved.');
   if(known.size)await store('flavors','','POST',[...known.values()].map(({id,name,kind})=>({id,name,kind})));
   // Stable order IDs replace prior snapshots, so refreshes cannot double-count sales.
   for(let i=0;i<summaries.length;i+=100)await store('orders','','POST',summaries.slice(i,i+100));
   const history_from=req.body?.history===true?shiftDay(dateKey(since),1):previous[0]?.history_from || null;
   await store('syncs','','POST',{id:crypto.randomUUID(),location_id:location.squareLocationId,history_from,finished_at:until,orders_processed:processed});
   res.json({orders:processed,review:summaries.reduce((n,o)=>n+o.issues.length,0)});
  }catch(error){res.status(503).json({error:error.message});}finally{activeSync.delete(location.id);}
 });
 return router;
};
