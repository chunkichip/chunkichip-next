const crypto = require('crypto');
const TZ = 'America/New_York';
const dateKey = value => new Intl.DateTimeFormat('en-CA', {timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
const normalize = name => String(name || '').toLowerCase().replace(/[^a-z0-9]/g,'');
const flavor = (name, kind='full') => ({ id:crypto.createHash('sha256').update(`${kind}:${normalize(name)}`).digest('hex').slice(0,24), name:String(name).trim(), kind });
const positive = value => { const n=Number(value); return Number.isSafeInteger(n) && n>0 && n<=100000 ? n : null; };
function boxSize(name) {
 const match=String(name).match(/^(\d+)\s+cookie\s+box$/i) || String(name).match(/^build your own\s+(\d+)\s+box$/i);
 return match ? positive(match[1]) : null;
}
// Menu membership is independent of the historical sales dictionary. Sold-out
// modifiers still belong to the menu and must remain available for bake planning.
function currentFlavors(items, lists, locationId) {
 const present=o=>!o.isDeleted && (o.presentAtAllLocations!==false || (o.presentAtLocationIds || []).includes(locationId)) && !(o.absentAtLocationIds || []).includes(locationId);
 const byId=new Map(lists.filter(present).map(l=>[l.id,l]));
 const active=new Map();
 for(const item of items) {
  if(!present(item) || !item.itemData || item.itemData.isArchived || item.itemData.ecomVisibility==='UNAVAILABLE' || !boxSize(item.itemData.name))continue;
  for(const ref of item.itemData.modifierListInfo || []) {
   if(ref.enabled===false)continue;
   for(const m of byId.get(ref.modifierListId)?.modifierListData?.modifiers || []) {
    if(!present(m) || !m.modifierData?.name || m.modifierData.isArchived)continue;
    const f=flavor(m.modifierData.name);active.set(f.id,f);
   }
  }
 }
 return [...active.values()];
}
function planFlavors(known, active, orders, events, date) {
 const ids=new Set(active.map(f=>f.id));
 for(const o of orders)if(o.business_date===date && o.paid && o.state!=='CANCELED')for(const f of o.counts || [])ids.add(f.id);
 for(const e of events)if(e.business_date===date)ids.add(e.flavor_id);
 return [...new Map([...known,...active].map(f=>[f.id,f])).values()].filter(f=>ids.has(f.id)).sort((a,b)=>a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));
}
function analyzeOrder(order, known=[]) {
 const due=order.fulfillments?.find(f=>f.state!=='CANCELED' && f.type==='PICKUP')?.pickup_details?.pickup_at;
 const at=due || order.closed_at || order.created_at;
 if (!at || Number.isNaN(Date.parse(at))) throw new Error('Square order has no valid date.');
 const paid=order.state==='COMPLETED' || (order.state==='OPEN' && order.tenders?.length>0 && Number(order.net_amount_due_money?.amount ?? 1)===0);
 const result={ id:order.id,location_id:order.location_id,version:Number(order.version || 0),business_date:dateKey(at),advance_order:dateKey(at)>dateKey(order.created_at || at),state:order.state,paid:Boolean(paid),ticket:String(/^[#0-9 -]{1,20}$/.test(order.ticket_name || '') ? order.ticket_name : order.id).slice(0,100),counts:[],issues:[],updated_at:order.updated_at || at };
 if (!paid || order.state==='CANCELED') return result;
 const quantities=new Map();
 function add(name,kind,quantity) {const f=flavor(name,kind); const old=quantities.get(f.id); quantities.set(f.id,{...f,quantity:(old?.quantity||0)+quantity});}
 for (const line of order.line_items || []) {
  const name=String(line.name || ''), count=positive(line.quantity), size=boxSize(name);
  const problem=message=>result.issues.push({item:name,message});
  if (!count) { problem('Non-integer item quantity needs review.'); continue; }
  if (size) {
   const mods=line.modifiers || [];
   const sum=mods.reduce((n,m)=>n+(positive(m.quantity ?? '1') || 0),0);
   if (!mods.length || mods.some(m=>!String(m.name || '').trim() || !positive(m.quantity ?? '1')) || sum!==size) { problem(`Flavor quantities do not total ${size} cookies per box.`); continue; }
   for(const m of mods) add(m.name,'full',positive(m.quantity ?? '1')*count);
  } else if (/^CATERING · /.test(line.note || '')) {
   const section=line.note.match(/Flavors: ([^.]+)\./)?.[1];
   const expected=Number(line.note.match(/^CATERING · (\d+) /)?.[1]);
   const entries=section?.split(', ').map(part=>part.match(/^(\d+) (.+)$/));
   if (!expected || !entries?.length || entries.some(e=>!e || !positive(e[1])) || entries.reduce((n,e)=>n+Number(e[1]),0)!==expected) {problem('Catering flavor quantities need review.');continue;}
   for(const e of entries) add(e[2],/chiptini|mini/i.test(`${name} ${line.note.split('. Flavors:')[0]}`) ? 'mini' : 'full',Number(e[1])*count);
  } else {
   const match=known.find(f=>normalize(f.name)===normalize(name) && f.kind==='full');
   if (match) add(match.name,'full',count);
   else if (!/^extra box$/i.test(name) && !/gift\s*card/i.test(name)) problem('No verified flavor breakdown. This item is excluded from totals.');
  }
 }
 result.counts=[...quantities.values()];
 if (order.returns?.length || Number(order.return_amounts?.total_money?.amount || 0)>0) result.issues.push({item:'Return/refund',message:'Review physical stock separately. Refunds do not automatically put cookies back in stock.'});
 return result;
}
function shiftDay(day, offset) {const d=new Date(`${day}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10);}
function buildPlan({flavors,orders,events,date,today,historyFrom,activeFlavorIds=flavors.map(f=>f.id)}) {
 const due=orders.filter(o=>o.business_date===date && o.paid && o.state!=='CANCELED');
 const sum=(list,id)=>list.reduce((n,o)=>n+(o.counts || []).filter(f=>f.id===id).reduce((a,f)=>a+f.quantity,0),0);
 const issues=due.flatMap(o=>(o.issues || []).map(issue=>({...issue,ticket:o.ticket})));
 // Use only completed, reconciled days. Today’s partial sales are not a full-day
 // demand observation, and advance orders are added separately below.
 const history=orders.filter(o=>o.business_date<date && o.business_date<today && historyFrom && o.business_date>=historyFrom && o.paid && o.state!=='CANCELED');
 const badDays=new Set(history.filter(o=>o.issues?.length).map(o=>o.business_date));
 const retail=history.filter(o=>!o.advance_order && !badDays.has(o.business_date));
 const byDay=new Map();
 for(const o of retail){if(!byDay.has(o.business_date))byDay.set(o.business_date,[]);byDay.get(o.business_date).push(o);}
 const matchingDays=Array.from({length:8},(_,n)=>shiftDay(date,-7*(n+1)));
 const samplesById=new Map(flavors.map(f=>[f.id,matchingDays.map(day=>({date:day,quantity:sum(byDay.get(day) || [],f.id)})).filter(s=>s.quantity>0)]));
 const direct=new Map(flavors.map(f=>{const samples=samplesById.get(f.id);return [f.id,samples.length>=3?Math.ceil(samples.reduce((n,s)=>n+s.quantity,0)/samples.length):null];}));
 const activeIds=new Set(activeFlavorIds);
 const weekday=new Date(`${date}T12:00:00Z`).getUTCDay();
 const weekStart=shiftDay(date,-((weekday+6)%7));
 const estimates=new Map();
 for(const kind of ['full','mini']) {
  const menu=flavors.filter(f=>f.kind===kind && activeIds.has(f.id));
  const newcomers=menu.filter(f=>direct.get(f.id)===null);
  if(!newcomers.length)continue;
  const totals=matchingDays.map(day=>({date:day,quantity:(byDay.get(day) || []).reduce((n,o)=>n+(o.counts || []).filter(f=>f.kind===kind).reduce((a,f)=>a+f.quantity,0),0)})).filter(s=>s.quantity>0);
  if(!totals.length)continue;
  const totalDemand=totals.reduce((n,s)=>n+s.quantity,0)/totals.length;
  const establishedIds=new Set(menu.filter(f=>direct.get(f.id)!==null).map(f=>f.id));
  const rotatingDemand=totals.reduce((n,s)=>n+(byDay.get(s.date) || []).reduce((a,o)=>a+(o.counts || []).filter(f=>f.kind===kind && !establishedIds.has(f.id)).reduce((b,f)=>b+f.quantity,0),0),0)/totals.length;
  // The demand left after established menu flavors includes past rotating
  // cookies. Share that pool equally until the new flavors have observed sales.
  const priorShare=rotatingDemand>0?rotatingDemand/totalDemand/newcomers.length:1/menu.length;
  for(const f of newcomers) {
   const firstDay=[...byDay.keys()].filter(day=>day>=weekStart && sum(byDay.get(day),f.id)>0).sort()[0];
   const observed=firstDay?retail.filter(o=>o.business_date>=firstDay):[];
   const weekQuantity=sum(observed,f.id);
   const weekTotal=observed.reduce((n,o)=>n+(o.counts || []).filter(c=>c.kind===kind).reduce((a,c)=>a+c.quantity,0),0);
   // A 100-cookie prior prevents one small early order dominating the estimate.
   const share=weekTotal>0?(100*priorShare+weekQuantity)/(100+weekTotal):priorShare;
   estimates.set(f.id,{baseline:Math.ceil(totalDemand*share),source:weekTotal>0?'weekly_mix':'new_flavor',totalDemand:Math.ceil(totalDemand),totalSamples:totals.length,weekQuantity,weekTotal});
  }
 }
 const rows=flavors.map(f=>{
  const movements=events.filter(e=>e.flavor_id===f.id && e.business_date===date).sort((a,b)=>a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
  const latest=kind=>movements.filter(e=>e.kind===kind).at(-1);
  const opening=latest('opening')?.quantity ?? null;
  const net=movements.filter(e=>!['opening','target','manual_sale'].includes(e.kind)).reduce((n,e)=>n+(['waste','manual_sale'].includes(e.kind)?-e.quantity:e.quantity),0);
  const sold=sum(due,f.id)+movements.filter(e=>e.kind==='manual_sale').reduce((n,e)=>n+e.quantity,0);
  const reserved=sum(due.filter(o=>o.advance_order),f.id);
  const samples=samplesById.get(f.id);
  const estimate=estimates.get(f.id);
  const baseline=direct.get(f.id) ?? estimate?.baseline ?? null;
  const forecastSource=direct.get(f.id)!==null?'same_flavor':estimate?.source || null;
  const manual=latest('target')?.quantity ?? null;
  const target=manual!==null ? Math.max(manual,reserved) : baseline!==null ? baseline+reserved : null;
  const stock=opening===null ? null : opening+net;
  const remaining=stock===null ? null : stock-sold;
  const needed=stock===null || target===null || issues.length ? null : Math.max(0,Math.max(target,sold)-stock);
  return {...f,opening,net,sold,reserved,remaining,baseline,forecastSource,forecastDetails:estimate || null,target,manualTarget:manual,samples,needed,trays:needed===null || f.kind!=='full' ? null : Math.ceil(needed/15)};
 });
 return {date,rows,issues,orderCount:due.length};
}
module.exports={currentFlavors,planFlavors,dateKey,flavor,normalize,positive,boxSize,analyzeOrder,buildPlan,shiftDay};
