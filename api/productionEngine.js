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
function buildPlan({flavors,orders,events,date,today,historyFrom}) {
 const due=orders.filter(o=>o.business_date===date && o.paid && o.state!=='CANCELED');
 const sum=(list,id)=>list.reduce((n,o)=>n+(o.counts || []).filter(f=>f.id===id).reduce((a,f)=>a+f.quantity,0),0);
 const issues=due.flatMap(o=>(o.issues || []).map(issue=>({...issue,ticket:o.ticket})));
 const rows=flavors.map(f=>{
  const movements=events.filter(e=>e.flavor_id===f.id && e.business_date===date).sort((a,b)=>a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
  const latest=kind=>movements.filter(e=>e.kind===kind).at(-1);
  const opening=latest('opening')?.quantity ?? null;
  const net=movements.filter(e=>!['opening','target','manual_sale'].includes(e.kind)).reduce((n,e)=>n+(['waste','manual_sale'].includes(e.kind)?-e.quantity:e.quantity),0);
  const sold=sum(due,f.id)+movements.filter(e=>e.kind==='manual_sale').reduce((n,e)=>n+e.quantity,0);
  const reserved=sum(due.filter(o=>o.advance_order),f.id);
  const samples=[];
  for(let n=1;n<=8;n++) {
   const day=shiftDay(date,-7*n);
   if(day>=today || !historyFrom || day<historyFrom) continue;
   const list=orders.filter(o=>o.business_date===day && o.paid && o.state!=='CANCELED');
   if(list.some(o=>o.issues?.length)) continue;
   const quantity=sum(list.filter(o=>!o.advance_order),f.id);
   // Without historical menu availability, an absent flavor is unknown, not zero demand.
   if(quantity>0) samples.push({date:day,quantity});
  }
  const baseline=samples.length>=3 ? Math.ceil(samples.reduce((n,s)=>n+s.quantity,0)/samples.length) : null;
  const manual=latest('target')?.quantity ?? null;
  const target=manual!==null ? Math.max(manual,reserved) : baseline!==null ? baseline+reserved : null;
  const stock=opening===null ? null : opening+net;
  const importedSold=sum(due,f.id);
  const remaining=stock===null ? null : stock-sold;
  const needed=stock===null || target===null || issues.length ? null : Math.max(0,Math.max(target,sold)-stock);
  return {...f,opening,net,sold,reserved,remaining,baseline,target,manualTarget:manual,samples,needed,trays:needed===null || f.kind!=='full' ? null : Math.ceil(needed/15)};
 });
 return {date,rows,issues,orderCount:due.length};
}
module.exports={dateKey,flavor,normalize,positive,boxSize,analyzeOrder,buildPlan,shiftDay};
