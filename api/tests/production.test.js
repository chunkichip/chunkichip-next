const test=require('node:test');
const assert=require('node:assert/strict');
const express=require('express');
const {flavor,analyzeOrder,buildPlan,dateKey}=require('../productionEngine');
const production=require('../production');
const base=()=>({id:'squareOrder60',location_id:'shop',version:1,state:'COMPLETED',created_at:'2026-11-11T21:21:39Z',closed_at:'2026-11-11T21:21:39Z',updated_at:'2026-11-11T21:21:39Z',ticket_name:'60',line_items:[{name:'4 Cookie Box',quantity:'1',modifiers:[{name:'Banana Crumb Cake'},{name:'Apple Cider Donut'},{name:'Chunki Chip',quantity:'2'}]}]});
test('ticket 60 expands to exactly four cookies',()=>{const o=analyzeOrder(base());assert.deepEqual(o.counts.map(f=>[f.name,f.quantity]),[['Banana Crumb Cake',1],['Apple Cider Donut',1],['Chunki Chip',2]]);assert.equal(o.issues.length,0);});
test('box and repeated modifier quantities multiply',()=>{const o=base();o.line_items[0].quantity='3';assert.equal(analyzeOrder(o).counts.find(f=>f.name==='Chunki Chip').quantity,6);});
test('repeated modifier rows and grouped quantities produce the same totals',()=>{const o=base();o.line_items[0].modifiers=[{name:'Chunki Chip'},{name:'Chunki Chip'},{name:'Chunki Chip'},{name:'Chunki Chip'}];assert.equal(analyzeOrder(o).counts[0].quantity,4);});
test('unallocated boxes are flagged instead of guessed',()=>{const o=base();o.line_items[0].modifiers.pop();const result=analyzeOrder(o);assert.equal(result.counts.length,0);assert.equal(result.issues.length,1);});
test('cancelled or unpaid orders consume no cookies',()=>{for(const state of ['CANCELED','OPEN']){const o=base();o.state=state;assert.equal(analyzeOrder(o).counts.length,0);}});
test('paid future pickup is assigned to its due day, not payment day',()=>{const o=base();o.state='OPEN';o.tenders=[{}];o.net_amount_due_money={amount:0};o.fulfillments=[{type:'PICKUP',state:'RESERVED',pickup_details:{pickup_at:'2026-11-15T17:00:00Z'}}];const result=analyzeOrder(o);assert.equal(result.business_date,'2026-11-15');assert.equal(result.advance_order,true);assert.equal(result.counts[2].quantity,2);});
test('full-size and Chiptini IDs cannot collide',()=>assert.notEqual(flavor('Chunki Chip','full').id,flavor('Chunki Chip','mini').id));
test('website catering notes count cookies and exclude dip modifiers',()=>{const o=base();o.line_items=[{name:'Catering Chiptinis',quantity:'2',note:'CATERING · 30 Chiptinis. Flavors: 10 Chunki Chip, 20 M&M. Dips (8 oz each): 1 Vanilla Frosting.',modifiers:[{name:'Vanilla Frosting',quantity:'1'}]}];const result=analyzeOrder(o);assert.deepEqual(result.counts.map(f=>[f.kind,f.quantity]),[['mini',20],['mini',40]]);assert.equal(result.issues.length,0);});
test('refund never silently restocks baked cookies',()=>{const o=base();o.return_amounts={total_money:{amount:450}};const result=analyzeOrder(o);assert.equal(result.counts[2].quantity,2);assert.ok(result.issues.some(i=>i.item==='Return/refund'));});
test('stock math counts manual sales once and uses whole-day targets',()=>{const f=flavor('Chunki Chip');const event=(kind,quantity,id)=>({id,flavor_id:f.id,business_date:'2026-11-11',kind,quantity,created_at:`2026-11-11T10:00:0${id}Z`});const p=buildPlan({flavors:[f],orders:[analyzeOrder(base())],events:[event('opening',10,'1'),event('bake',5,'2'),event('waste',1,'3'),event('manual_sale',2,'4'),event('target',20,'5')],date:'2026-11-11',today:'2026-11-11'}).rows[0];assert.equal(p.remaining,10);assert.equal(p.sold,4);assert.equal(p.needed,6);});
test('unentered opening stock never pretends to be zero',()=>{const f=flavor('Chunki Chip');const p=buildPlan({flavors:[f],orders:[],events:[],date:'2026-11-11',today:'2026-11-11'}).rows[0];assert.equal(p.remaining,null);assert.equal(p.needed,null);});
test('forecast requires three comparable observations and does not invent zero-sales availability',()=>{const f=flavor('Chunki Chip');const orders=['2026-10-21','2026-10-28','2026-11-04'].map((day,i)=>({id:String(i),business_date:day,paid:true,state:'COMPLETED',advance_order:false,counts:[{...f,quantity:10+i*5}],issues:[]}));const p=buildPlan({flavors:[f],orders,events:[],date:'2026-11-11',today:'2026-11-11',historyFrom:'2026-09-01'}).rows[0];assert.equal(p.baseline,15);assert.equal(p.samples.length,3);});
test('business dates use New York time including daylight savings',()=>{assert.equal(dateKey('2026-11-12T02:00:00Z'),'2026-11-11');assert.equal(dateKey('2026-07-12T03:30:00Z'),'2026-07-11');});
async function harness(t){
 const tables={flavors:[],orders:[],events:[],syncs:[],reviews:[]};let reads=0;
 const store=async(table,query='',method='GET',body)=>{if(method==='POST'){for(const row of Array.isArray(body)?body:[body]){const at=tables[table].findIndex(r=>r.id===row.id);if(at>=0)tables[table][at]={...tables[table][at],...row};else tables[table].push({...row,created_at:new Date().toISOString()});}return [];}let rows=tables[table].slice();for(const [key,value] of new URLSearchParams(query)){if(value.startsWith('eq.'))rows=rows.filter(r=>String(r[key])===value.slice(3));}return rows;};
 const app=express();app.use(express.json());app.use('/api/production',production({configuredLocations:()=>[{id:'milford',name:'Milford',squareLocationId:'shop'}],searchCatalog:async()=>[],store,verifyUser:async token=>({id:'owner',app_metadata:{site_admin:token==='owner'}}),squareRequest:async(path)=>{assert.equal(path,'/orders/search');reads++;return {orders:[base()]};}}));
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));t.after(()=>server.close());
 const request=async(path='',body,token='owner')=>{const r=await fetch(`http://127.0.0.1:${server.address().port}/api/production${path}`,{method:body?'POST':'GET',headers:{...(token?{Authorization:`Bearer ${token}`}:{ }),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json()};};return {request,tables,reads:()=>reads};
}
test('private API denies anonymous and non-owner requests before reading Square',async t=>{const h=await harness(t);assert.equal((await h.request('',null,'')).status,401);assert.equal((await h.request('/sync',{location:'milford'},'customer')).status,403);assert.equal(h.reads(),0);});
test('refresh twice replaces the same Square order, not two sales',async t=>{const h=await harness(t);await h.request('/sync',{location:'milford'});await h.request('/sync',{location:'milford'});assert.equal(h.tables.orders.length,1);assert.equal(h.tables.orders[0].counts[2].quantity,2);assert.equal(h.tables.flavors.length,3);});
test('stock request retry is idempotent and invalid input is rejected',async t=>{const h=await harness(t);const f=flavor('Chunki Chip');h.tables.flavors.push(f);const body={id:'00000000-0000-4000-8000-000000000001',date:'2026-11-11',location:'milford',flavorId:f.id,kind:'bake',quantity:15};assert.equal((await h.request('/events',body)).status,200);assert.equal((await h.request('/events',body)).status,200);assert.equal(h.tables.events.length,1);assert.equal((await h.request('/events',{...body,quantity:20})).status,409);assert.equal((await h.request('/events',{...body,quantity:1.5})).status,400);});
test('review overrides stay separate from Square snapshots and require current version',async t=>{const h=await harness(t);await h.request('/sync',{location:'milford'});const f=h.tables.flavors[0];const body={orderId:'squareOrder60',version:1,counts:[{id:f.id,quantity:4}],note:'Verified against ticket'};assert.equal((await h.request('/resolve',body)).status,200);assert.equal(h.tables.orders[0].counts.length,3);assert.equal(h.tables.reviews[0].counts[0].quantity,4);assert.equal((await h.request('/resolve',{...body,version:0})).status,409);});

test('current lineup uses enabled local box lists and keeps sold-out cookies for baking',()=>{
 const {currentFlavors}=require('../productionEngine');
 const item=(id,ref,extra={})=>({id,itemData:{name:'4 Cookie Box',modifierListInfo:[ref],...extra}});
 const mod=(name,extra={})=>({modifierData:{name,...extra}});
 const items=[item('current',{modifierListId:'now'}),item('removed',{modifierListId:'old',enabled:false}),item('archived',{modifierListId:'old'},{isArchived:true}),{...item('other-shop',{modifierListId:'old'}),presentAtAllLocations:false,presentAtLocationIds:['other']}];
 const lists=[{id:'now',modifierListData:{modifiers:[mod('Chunki Chip',{locationOverrides:[{locationId:'shop',soldOut:true}]}),mod('Archived',{isArchived:true}),{...mod('Other shop'),absentAtLocationIds:['shop']}]}},{id:'old',modifierListData:{modifiers:[mod('Halloween Cookie')]}}];
 assert.deepEqual(currentFlavors(items,lists,'shop').map(f=>f.name),['Chunki Chip']);
});
test('history cannot expand today’s lineup but still forecasts active cookies',()=>{
 const {planFlavors}=require('../productionEngine');const current=flavor('Chunki Chip'),old=flavor('Halloween Cookie');
 const orders=['2026-10-21','2026-10-28','2026-11-04'].map(day=>({business_date:day,paid:true,state:'COMPLETED',counts:[{...current,quantity:20},{...old,quantity:10}],issues:[]}));
 const flavors=planFlavors([current,old],[current],orders,[],'2026-11-11');
 assert.deepEqual(flavors.map(f=>f.id),[current.id]);
 const plan=buildPlan({flavors,orders,events:[],date:'2026-11-11',today:'2026-11-11',historyFrom:'2026-09-01'});
 assert.equal(plan.rows[0].baseline,20);assert.equal(orders[0].counts.length,2);
});
test('selected-day orders and stock keep off-menu cookies visible without leaking other dates',()=>{
 const {planFlavors}=require('../productionEngine');const ordered=flavor('Special order'),stock=flavor('Leftover'),old=flavor('Old');
 const orders=[{business_date:'2026-11-11',paid:true,state:'COMPLETED',counts:[ordered]},{business_date:'2026-11-10',paid:true,state:'COMPLETED',counts:[old]}];
 const events=[{business_date:'2026-11-11',flavor_id:stock.id}];
 assert.deepEqual(new Set(planFlavors([ordered,stock,old],[],orders,events,'2026-11-11').map(f=>f.id)),new Set([ordered.id,stock.id]));
});
test('API hides historical flavors while preserving review choices and manual daily additions',async t=>{
 const h=await harness(t);await h.request('/sync',{location:'milford',history:true});
 let plan=await h.request('?date=2026-11-12');assert.equal(plan.status,200);assert.equal(plan.data.rows.length,0);assert.equal(plan.data.allFlavors.length,3);
 assert.equal((await h.request('/flavors',{name:'Custom cookie',kind:'full',location:'milford',date:'2026-11-12'})).status,200);
 plan=await h.request('?date=2026-11-12');assert.deepEqual(plan.data.rows.map(f=>f.name),['Custom cookie']);
 assert.equal(h.tables.orders.length,1);assert.equal(h.tables.events[0].quantity,0);
});

function rotatingFixture(){
 const classic=flavor('Chunki Chip'),old=flavor('Past special'),a=flavor('Brand new A'),b=flavor('Brand new B');
 const order=(id,day,counts,extra={})=>({id,business_date:day,paid:true,state:'COMPLETED',advance_order:false,counts:counts.map(([f,quantity])=>({...f,quantity})),issues:[],...extra});
 const orders=['2026-10-23','2026-10-30','2026-11-06'].map((day,i)=>order(String(i),day,[[classic,60],[old,40]]));
 const args={flavors:[classic,a,b],orders,events:[],date:'2026-11-13',today:'2026-11-13',historyFrom:'2026-09-18'};
 return {classic,old,a,b,order,args};
}
test('new specials inherit the historical rotating demand pool without showing old flavors',()=>{
 const {classic,a,b,args}=rotatingFixture();const rows=buildPlan(args).rows;
 assert.equal(rows.find(f=>f.id===classic.id).baseline,60);
 for(const id of [a.id,b.id]){const row=rows.find(f=>f.id===id);assert.equal(row.baseline,20);assert.equal(row.forecastSource,'new_flavor');assert.equal(row.samples.length,0);assert.equal(row.needed,null);}
 assert.equal(rows.length,3);
});
test('completed sales this week refine new specials while partial today and advance orders are excluded',()=>{
 const {classic,a,b,order,args}=rotatingFixture();
 args.orders.push(order('thu','2026-11-12',[[classic,50],[a,40],[b,10]]),order('today','2026-11-13',[[a,900]]),order('catering','2026-11-12',[[b,500]],{advance_order:true}));
 const rows=buildPlan(args).rows;
 assert.equal(rows.find(f=>f.id===a.id).baseline,30);assert.equal(rows.find(f=>f.id===b.id).baseline,15);
 assert.equal(rows.find(f=>f.id===a.id).forecastSource,'weekly_mix');assert.equal(rows.find(f=>f.id===a.id).forecastDetails.weekTotal,100);
});
test('new special suggestions add due advance orders and subtract opening stock and net bakes once',()=>{
 const {a,order,args}=rotatingFixture();args.orders.push(order('preorder','2026-11-13',[[a,5]],{advance_order:true}));
 args.events=['opening','bake','waste'].map((kind,i)=>({id:String(i),flavor_id:a.id,business_date:args.date,created_at:`2026-11-13T09:00:0${i}Z`,kind,quantity:[10,4,1][i]}));
 const row=buildPlan(args).rows.find(f=>f.id===a.id);assert.equal(row.target,25);assert.equal(row.needed,12);assert.equal(row.remaining,8);
 args.events.push({id:'3',flavor_id:a.id,business_date:args.date,created_at:'2026-11-13T09:00:03Z',kind:'target',quantity:30});
 assert.equal(buildPlan(args).rows.find(f=>f.id===a.id).target,30);
});
test('fallback skips unresolved history, keeps size groups separate, and never guesses without history',()=>{
 const {a,order,args}=rotatingFixture();const mini=flavor('Mini','mini');
 args.orders.push(order('mini','2026-11-06',[[mini,1000]]),order('bad','2026-10-16',[[a,900]],{issues:[{message:'Unallocated box'}]}));
 let row=buildPlan(args).rows.find(f=>f.id===a.id);assert.equal(row.baseline,20);assert.equal(row.forecastDetails.totalSamples,3);
 assert.equal(buildPlan({...args,historyFrom:null}).rows.find(f=>f.id===a.id).baseline,null);
 row=buildPlan({...args,activeFlavorIds:[args.flavors[0].id]}).rows.find(f=>f.id===a.id);assert.equal(row.baseline,null);
});
test('flavors are not penalized for days before their first observed sales this week',()=>{
 const {classic,a,b,order,args}=rotatingFixture();args.orders.push(order('mon','2026-11-09',[[classic,900]]),order('thu','2026-11-12',[[classic,50],[a,40],[b,10]]));
 const row=buildPlan(args).rows.find(f=>f.id===a.id);assert.equal(row.baseline,30);assert.equal(row.forecastDetails.weekTotal,100);
});
test('a brand-new special still gets a starting share when history contains only classics',()=>{
 const {a,classic,args}=rotatingFixture();args.orders=args.orders.map(o=>({...o,counts:[{...classic,quantity:90}]}));
 const row=buildPlan(args).rows.find(f=>f.id===a.id);assert.equal(row.baseline,30);assert.equal(row.forecastSource,'new_flavor');
});
