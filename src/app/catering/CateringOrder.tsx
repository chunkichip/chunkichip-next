'use client';
import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';

type Package = { key:string; kind:'mini'|'full'; size:number; wrapped:boolean; price:number; name:string; available:boolean; dips:{name:string;price:number;available:boolean}[] };
type Slot = {at:string;date:string;time:string};
type Menu = {packages:Package[];slots:Slot[];timezone:string;pickupHours:string;flavors:Record<'full'|'mini',string[]>;address?:{addressLine1?:string;locality?:string}};
const dollars = (n:number) => `$${(n/100).toFixed(2)}`;
const field = 'soft-inset mt-2 block min-h-12 w-full min-w-0 rounded-2xl border border-transparent bg-[#f5f6f8] px-4 py-3 font-normal focus:border-[#eb2327] focus:outline-none';
const action = 'soft-action inline-flex min-h-12 items-center justify-center rounded-full px-7 py-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50';
async function request(path:string, body?:unknown) {
  const response = await fetch(`/api/catering/${path}`,{...(body ? {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)} : {}),signal:AbortSignal.timeout(30000)});
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Please try again or call the shop.');
  return data;
}
export default function CateringOrder() {
  const [menu,setMenu] = useState<Menu|null>(null), [loadError,setLoadError] = useState(''), [reload,setReload] = useState(0);
  const [kind,setKind] = useState<'mini'|'full'>('full'), [packageKey,setPackageKey] = useState('full-24-unwrapped');
  const [flavors,setFlavors] = useState<Record<string,number>>({'Chunki Chip':24}), [dips,setDips] = useState<Record<string,number>>({});
  const [date,setDate] = useState(''), [pickupAt,setPickupAt] = useState('');
  const [busy,setBusy] = useState(false), [error,setError] = useState(''), [attemptId,setAttemptId] = useState('');
  const [quoteBusy,setQuoteBusy] = useState(false), [quoteError,setQuoteError] = useState(''), [quoteId,setQuoteId] = useState(''), [quoteSent,setQuoteSent] = useState('');
  useEffect(()=>{let active=true; setLoadError(''); request('menu').then(data=>{if(active)setMenu(data);}).catch(e=>{if(active)setLoadError(e.message);});return()=>{active=false;};},[reload]);
  const pack = menu?.packages.find(p=>p.key===packageKey);
  const flavorNames = menu?.flavors[kind] || [];
  const count = Object.values(flavors).reduce((a,b)=>a+b,0);
  const dipCount = Object.values(dips).reduce((a,b)=>a+b,0);
  const dates = [...new Set(menu?.slots.map(s=>s.date) || [])];
  const total = (pack?.price || 0)+dipCount*400;
  function selectPack(p:Package) {setPackageKey(p.key);setKind(p.kind);setFlavors({'Chunki Chip':p.size});setDips({});setAttemptId('');setError('');}
  function changeFlavor(name:string, requested:number) {
    const size = pack?.size || 0, step = kind==='mini' ? 10 : 1;
    setFlavors(previous => {
      const otherCount = Object.entries(previous).reduce((sum,[flavor,quantity]) => sum+(flavor===name ? 0 : quantity),0);
      const maximum = Math.max(0,Math.floor((size-otherCount)/step)*step);
      const quantity = Number.isFinite(requested) ? Math.max(0,Math.floor(requested/step)*step) : 0;
      return {...previous,[name]:Math.min(maximum,quantity)};
    });
  }
  async function checkout(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); if(busy || !pack || count!==pack.size) return;
    const form = new FormData(event.currentTarget), id = attemptId || crypto.randomUUID();setAttemptId(id);setBusy(true);setError('');
    try {const data = await request('checkout',{packageKey,flavors,dips,pickupAt,name:form.get('name'),email:form.get('email'),phone:form.get('phone'),attemptId:id});window.location.assign(data.url);}
    catch(e){setError(e instanceof Error ? e.message : 'Could not open checkout. Please try again.');setBusy(false);}
  }
  async function quote(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();if(quoteBusy)return;
    const form = new FormData(event.currentTarget), id = quoteId || crypto.randomUUID();setQuoteId(id);setQuoteBusy(true);setQuoteError('');
    try {await request('quote',{...Object.fromEntries(form),id});setQuoteSent(id);}
    catch(e){setQuoteError(e instanceof Error ? e.message : 'Please try again or call the shop.');}
    finally {setQuoteBusy(false);}
  }
  return <>
    <section id="order" className="mt-12 scroll-mt-36">
      <p className="text-xs font-black uppercase tracking-[.22em] text-[#eb2327]">Your crowd. Your cookies.</p>
      <h2 className="brand-heading mt-3 text-5xl md:text-7xl">BUILD THE SPREAD.</h2>
      <p className="mt-4 max-w-2xl leading-7 text-black/65">Order one preset package for Milford pickup, with at least 48 hours’ notice. Need a bigger spread or something custom? <a href="#quote" className="font-bold underline">Request a quote below.</a></p>
      {loadError ? <div role="alert" className="soft-card mt-6 bg-white p-7"><p>{loadError}</p><button className="mt-4 font-bold underline" onClick={()=>setReload(v=>v+1)}>Reload catering menu</button><p className="mt-3">You can also call <a href="tel:+16035548571" className="underline">(603) 554-8571</a>.</p></div> : !menu ? <p role="status" className="py-10">Loading catering packages…</p> : <form onSubmit={checkout} className="mt-7 grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
        <div className="soft-card min-w-0 bg-white p-6 md:p-9">
          <fieldset disabled={busy}><legend className="text-xl font-black">1. Pick your package</legend>
            <div className="my-5 flex flex-wrap gap-3">{(['full','mini'] as const).map(k=><button key={k} type="button" aria-pressed={kind===k} onClick={()=>{const p=menu.packages.find(p=>p.kind===k);if(p)selectPack(p);}} className={`min-h-12 rounded-full border px-6 py-3 font-bold ${kind===k?'border-[#eb2327] bg-[#eb2327] text-white':'border-black/15'}`}>{k==='mini'?'Chiptinis':'Full-size classics'}</button>)}</div>
            <p className="mb-5 text-sm leading-6 text-black/65">{kind==='mini'?'Mini cookies made for sharing. Packages are cookies only. Add any 8 oz frosting dip for $4.':'Choose your mix of our six classics, wrapped individually or unwrapped for your dessert spread.'}</p>
            <div className="grid gap-3 sm:grid-cols-2">{menu.packages.filter(p=>p.kind===kind).map(p=><label key={p.key} className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 ${packageKey===p.key?'border-[#eb2327] bg-[#fff3fa]':'border-black/10'} ${!p.available?'opacity-55':''}`}><input type="radio" name="package" value={p.key} checked={packageKey===p.key} onChange={()=>selectPack(p)} disabled={!p.available} className="mt-1 h-4 w-4 accent-[#eb2327]"/><span><strong className="block">{p.size} {p.kind==='mini'?'Chiptinis':'cookies'}</strong>{p.kind==='full'&&<span className="block text-sm">{p.wrapped?'Individually wrapped':'Unwrapped'}</span>}<span className="mt-2 block font-black text-[#eb2327]">{dollars(p.price)}</span>{!p.available&&<span className="mt-1 block text-xs">Call for availability</span>}</span></label>)}</div>
          </fieldset>
          <fieldset disabled={busy || !pack?.available} className="mt-9"><legend className="text-xl font-black">2. Make your flavor mix</legend><p className="mt-2 text-sm text-black/65">{kind==='mini' ? 'Choose Chiptini flavors in groups of 10.' : 'Enter how many of each flavor you’d like.'} Your total must be {pack?.size}.</p>
            <div className="mt-4 grid gap-3">{flavorNames.map(name=>{const maximum=Math.max(0,(pack?.size || 0)-count+(flavors[name] || 0));return <label key={name} className="flex items-center justify-between gap-4 rounded-xl bg-[#f5f6f8] px-4 py-3"><span className="text-sm font-bold">{name}</span>{kind==='mini' ? <select aria-label={`${name} quantity`} value={flavors[name] || 0} onChange={e=>changeFlavor(name,Number(e.target.value))} className="min-h-11 w-24 shrink-0 rounded-lg border border-black/15 bg-white p-2 text-center">{Array.from({length:Math.floor(maximum/10)+1},(_,i)=>i*10).map(q=><option key={q} value={q}>{q}</option>)}</select> : <input type="number" min="0" max={maximum} step="1" aria-label={`${name} quantity`} value={flavors[name] || 0} onChange={e=>changeFlavor(name,Number(e.target.value))} className="min-h-11 w-20 shrink-0 rounded-lg border border-black/15 bg-white p-2 text-center"/>}</label>;})}</div>
            <p aria-live="polite" className={`mt-4 font-bold ${count===pack?.size?'text-black':'text-[#b51722]'}`}>{count} of {pack?.size} cookies selected</p>{count===pack?.size&&<p className="mt-2 text-sm text-black/65">Your package is full. Reduce one flavor to make room for another.</p>}
          </fieldset>
          {kind==='mini'&&<fieldset disabled={busy || !pack?.available} className="mt-9"><legend className="text-xl font-black">3. Add dips, if you want</legend><p className="mt-2 text-sm text-black/65">$4 per 8 oz dip. A starting point: one dip per 30 Chiptinis.</p><div className="mt-4 grid gap-3">{pack?.dips.map(d=><label key={d.name} className="flex items-center justify-between gap-3 rounded-xl bg-[#f5f6f8] px-4 py-3"><span className="text-sm font-bold">{d.name}<span className="block text-xs font-normal">8 oz · $4{!d.available?' · Call for availability':''}</span></span><input type="number" aria-label={`${d.name} dip quantity`} min="0" max="12" step="1" disabled={!d.available} value={dips[d.name]||0} onChange={e=>setDips({...dips,[d.name]:Number(e.target.value)})} className="min-h-11 w-20 shrink-0 rounded-lg border border-black/15 bg-white p-2 text-center"/></label>)}</div><p className="mt-3 text-xs text-black/60">Up to 12 dips per preset order. For larger quantities, request a quote.</p></fieldset>}
        </div>
        <div className="soft-card min-w-0 self-start bg-white p-6 md:p-8">
          <h3 className="brand-heading text-4xl">MAKE IT A DATE.</h3>
          <p className="mt-3 text-sm leading-6">Pickup at {menu.address?.addressLine1 || 'our Milford shop'}{menu.address?.locality?`, ${menu.address.locality}`:''}.</p><p className="mt-2 text-sm font-bold">{menu.pickupHours}</p>
          {!dates.length&&<p role="status" className="mt-4 rounded-xl bg-[#ffccef] p-4 text-sm">Online pickup times are unavailable. Call the shop to schedule or send a quote request.</p>}
          <fieldset disabled={busy || !pack?.available || !dates.length} className="mt-6 grid min-w-0 gap-4">
            <label className="font-bold">Pickup date<select required className={field} value={date} onChange={e=>{setDate(e.target.value);setPickupAt('');}}><option value="">Choose a date</option>{dates.map(d=><option key={d} value={d}>{new Date(`${d}T12:00:00`).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</option>)}</select></label>
            <label className="font-bold">Pickup time<select required className={field} value={pickupAt} onChange={e=>setPickupAt(e.target.value)}><option value="">Choose a time</option>{menu.slots.filter(s=>s.date===date).map(s=><option key={s.at} value={s.at}>{new Date(s.at).toLocaleTimeString('en-US',{timeZone:menu.timezone,hour:'numeric',minute:'2-digit'})}</option>)}</select></label>
            <label className="font-bold">Your name<input name="name" required autoComplete="name" maxLength={120} className={field}/></label>
            <label className="font-bold">Email<input name="email" type="email" required autoComplete="email" maxLength={254} className={field}/></label>
            <label className="font-bold">Phone<input name="phone" type="tel" required autoComplete="tel" maxLength={40} className={field}/></label>
          </fieldset>
          <div className="my-6 border-y border-black/10 py-5"><p className="font-bold">{pack?.name}</p>{dipCount>0&&<p className="mt-2 text-sm">{dipCount} × 8 oz dip · {dollars(dipCount*400)}</p>}<p className="mt-4 flex justify-between gap-3 text-xl font-black"><span>Subtotal</span><span>{dollars(total)}</span></p><p className="mt-2 text-xs text-black/60">Tax calculated at Square checkout. Your pickup is booked after payment.</p></div>
          {error&&<p role="alert" className="mb-5 rounded-xl bg-[#ffe5ee] p-4 text-sm text-[#a91620]">{error}</p>}
          <button disabled={busy || !pack?.available || count!==pack.size || dipCount>12 || !pickupAt} className={`${action} w-full`}>{busy?'Opening secure checkout…':'Continue to payment'}</button>
          <p className="mt-4 text-xs leading-5 text-black/60">Please review your package, flavors, and pickup time before paying.</p>
        </div>
      </form>}
    </section>
    <section id="quote" className="soft-card mt-14 scroll-mt-36 bg-white p-6 md:p-10">
      <p className="text-xs font-black uppercase tracking-[.22em] text-[#eb2327]">Bigger plans?</p><h2 className="brand-heading mt-3 text-5xl md:text-6xl">LET’S TALK COOKIES.</h2>
      <p className="mt-4 max-w-3xl leading-7 text-black/65">More than 72 full-size cookies or 90 Chiptinis? Planning a wedding, company event, mixed spread, delivery, or a special request? Tell us what you have in mind. We’ll confirm availability and pricing with you.</p>
      {quoteSent?<div role="status" className="mt-7 rounded-2xl bg-[#fff0f9] p-6"><h3 className="text-xl font-black">Your request is in.</h3><p className="mt-3 leading-7">The Chunki Chip team will review your details and follow up. This is a quote request; your order is not booked yet.</p><p className="mt-3 break-all text-xs">Reference: {quoteSent}</p><p className="mt-3">Need to reach us? <a className="underline" href="tel:+16035548571">(603) 554-8571</a></p></div>:<form onSubmit={quote} className="mt-7"><fieldset disabled={quoteBusy} className="grid min-w-0 gap-5 md:grid-cols-2">
        <label className="font-bold">Name<input name="name" required maxLength={120} autoComplete="name" className={field}/></label>
        <label className="font-bold">Email<input name="email" type="email" required maxLength={254} autoComplete="email" className={field}/></label>
        <label className="font-bold">Phone<input name="phone" type="tel" required maxLength={40} autoComplete="tel" className={field}/></label>
        <label className="min-w-0 font-bold">Event date<input name="eventDate" type="date" required min={new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'})} className={`${field} max-w-full`}/></label>
        <label className="font-bold">What’s the occasion?<input name="eventType" placeholder="Office meeting, shower, wedding…" maxLength={200} className={field}/></label>
        <label className="font-bold">How many cookies or guests?<input name="quantity" required maxLength={200} placeholder="120 cookies for 60 guests" className={field}/></label>
        <label className="font-bold">Pickup or delivery request?<select name="fulfillment" className={field}><option>Milford pickup</option><option>Delivery request (subject to availability)</option><option>Not sure yet</option></select></label>
        <label className="font-bold md:col-span-2">Tell us about your spread<textarea name="details" required maxLength={3000} rows={5} placeholder="Cookie sizes, flavors, wrapped or unwrapped, dips, event time, budget, dietary questions, and delivery address if requested." className={field}/></label>
        <label className="hidden" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label>
      </fieldset>
      <p className="mt-5 text-xs leading-6 text-black/60">We use these details to respond to your catering request. See our <Link href="/privacy" className="underline">Privacy Policy</Link>. Please allow at least 48 hours for catering orders; submitting a request does not reserve a date.</p>
      {quoteError&&<p role="alert" className="mt-5 text-[#a91620]">{quoteError}</p>}<button disabled={quoteBusy} className={`${action} mt-6`}>{quoteBusy?'Sending request…':'Request a quote'}</button>
      </form>}
    </section>
  </>;
}
