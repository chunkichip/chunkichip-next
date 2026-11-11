'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import CookieSpinner from './CookieSpinner';

type Menu = { locationId:string; locationName:string; timezone:string; hoursLabel?:string; closeCutoffMinutes:number; advanceDays:number; locations:{id:string;name:string}[]; slots:{at:string;date:string;time:string}[] };
type Props = { items: unknown[]; method:'pickup'|'curbside'; giftCardCheckout:boolean; onClose:()=>void };
const field = 'mt-2 min-h-12 w-full rounded-2xl border border-black/20 bg-white px-4 py-3 text-base font-normal';

export default function PickupCheckout({items,method,giftCardCheckout,onClose}:Props) {
  const [locationId,setLocationId] = useState('');
  const [menu,setMenu] = useState<Menu|null>(null);
  const [mode,setMode] = useState<'earliest'|'later'>('earliest');
  const [date,setDate] = useState(''), [at,setAt] = useState('');
  const [loading,setLoading] = useState(true), [busy,setBusy] = useState(false), [error,setError] = useState('');
  const [retry,setRetry] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setMenu(null); setError(''); setDate(''); setAt('');
    fetch(`/api/pickup-options${locationId ? `?locationId=${encodeURIComponent(locationId)}` : ''}`, {cache:'no-store',signal:controller.signal})
      .then(async response => {const data=await response.json();if(!response.ok)throw new Error(data.error || 'Pickup times could not load.');return data as Menu;})
      .then(data => {setMenu(data);setDate(data.slots[0]?.date || '');setAt(data.slots[0]?.at || '');})
      .catch(e => {if(!controller.signal.aborted)setError(e instanceof Error ? e.message : 'Pickup times could not load.');})
      .finally(() => {if(!controller.signal.aborted)setLoading(false);});
    return () => controller.abort();
  }, [locationId,retry]);
  const selectedAt = mode === 'earliest' ? menu?.slots[0]?.at : at;
  const valid = Boolean(menu?.slots.some(slot => slot.at === selectedAt));
  const dates = [...new Set(menu?.slots.map(slot => slot.date) || [])];
  const formatAt = (value:string) => new Intl.DateTimeFormat('en-US',{timeZone:menu?.timezone || 'America/New_York',weekday:'long',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(new Date(value));
  const formatDate = (value:string) => new Intl.DateTimeFormat('en-US',{timeZone:'UTC',weekday:'long',month:'short',day:'numeric'}).format(new Date(value+'T12:00:00Z'));
  function chooseDate(value:string) {setDate(value);setAt(menu?.slots.find(slot => slot.date===value)?.at || '');setError('');}
  async function submit(event:FormEvent) {
    event.preventDefault(); if(!valid || !menu || busy)return;
    setBusy(true);setError('');
    try {
      const response = await fetch('/api/create-checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items,checkoutMethod:method,giftCardCheckout,locationId:menu.locationId,pickupAt:selectedAt})});
      const data = await response.json();
      if(!response.ok || !data.url)throw new Error(data.error || 'Could not start checkout. Please try again.');
      if(data.curbsideCheckinUrl){try{localStorage.setItem('chunki-curbside-checkin',data.curbsideCheckinUrl);}catch{}}
      window.location.assign(data.url);
    } catch(e) {setError(e instanceof Error ? e.message : 'Could not start checkout. Please try again.');setBusy(false);}
  }
  return <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="pickup-heading">
    <form onSubmit={submit} className="max-h-[92svh] w-full max-w-xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8" aria-busy={loading || busy}>
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.2em] text-[#eb2327]">{method==='curbside'?'Curbside pickup':'In-store pickup'}</p><h2 ref={heading} tabIndex={-1} id="pickup-heading" className="brand-heading mt-3 text-4xl outline-none sm:text-5xl">PICK YOUR PICKUP.</h2></div><button type="button" disabled={busy} aria-label="Close pickup scheduling" onClick={onClose} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#ffccef] text-2xl">×</button></div>
      {loading ? <div role="status" className="flex items-center gap-4 py-10"><CookieSpinner size={40}/><span>Loading available pickup times…</span></div> : menu && <>
        {menu.locations.length>1 ? <label className="mt-6 block font-bold">Pickup location<select className={field} value={menu.locationId} disabled={busy} onChange={e=>setLocationId(e.target.value)}>{menu.locations.map(location=><option key={location.id} value={location.id}>{location.name}</option>)}</select></label> : <p className="mt-5 font-bold">{menu.locationName} · {method==='curbside'?'Curbside':'Carryout'}</p>}
        {menu.slots.length ? <>
          <fieldset disabled={busy} className="mt-6"><legend className="font-bold">When would you like your cookies?</legend><div className="mt-3 grid gap-3 sm:grid-cols-2">{(['earliest','later'] as const).map(value=><label key={value} className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 text-sm font-bold ${mode===value?'border-[#eb2327] bg-[#fff7fb]':'border-black/15'}`}><input type="radio" name="pickup-mode" value={value} checked={mode===value} onChange={()=>{setMode(value);setError('');}} className="accent-[#eb2327]"/>{value==='earliest'?'Earliest available':'Schedule for later'}</label>)}</div></fieldset>
          {mode==='later' && <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="font-bold">Pickup date<select required className={field} value={date} disabled={busy} onChange={e=>chooseDate(e.target.value)}>{dates.map(day=><option key={day} value={day}>{formatDate(day)}</option>)}</select></label><label className="font-bold">Pickup time<select required className={field} value={at} disabled={busy} onChange={e=>{setAt(e.target.value);setError('');}}>{menu.slots.filter(slot=>slot.date===date).map(slot=><option key={slot.at} value={slot.at}>{new Intl.DateTimeFormat('en-US',{timeZone:menu.timezone,hour:'numeric',minute:'2-digit'}).format(new Date(slot.at))}</option>)}</select></label></div>}
          {selectedAt && <div className="mt-6 rounded-2xl bg-[#ffccef] p-5" role="status"><p className="text-xs font-black uppercase tracking-widest">Your pickup time</p><p className="mt-2 text-lg font-bold">{formatAt(selectedAt)}</p><p className="mt-2 text-sm">{menu.locationName} · {method==='curbside'?'Curbside pickup':'In-store pickup'}</p></div>}
          <p className="mt-4 text-xs leading-6 text-black/65">Times are local to the shop. Schedule up to {menu.advanceDays} days ahead. Last pickup is {menu.closeCutoffMinutes} minutes before closing.</p>
          {menu.hoursLabel && <p className="mt-2 text-xs leading-6 text-black/65">{menu.hoursLabel}</p>}
          {method==='curbside' && <p className="mt-3 text-sm leading-6">After payment, save your check-in page. Tap “I’m here” only when you arrive.</p>}
        </> : <p className="mt-6 leading-7">No online pickup times are available. Please call the shop for help.</p>}
      </>}
      {error && <p className="mt-5 rounded-xl border border-[#eb2327] p-4 text-sm" role="alert">{error}</p>}
      <div className="mt-6 flex flex-col gap-4"><button type="submit" disabled={loading || busy || !valid} className="flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#eb2327] px-6 py-3 font-bold text-white disabled:opacity-40">{busy ? <><CookieSpinner size={24}/>Opening secure checkout…</> : 'Continue to payment'}</button><button type="button" disabled={busy || loading} className="text-sm font-bold underline underline-offset-4" onClick={()=>setRetry(value=>value+1)}>Refresh available times</button></div>
    </form>
  </div>;
}
