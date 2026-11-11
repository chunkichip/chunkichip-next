'use client';
import { useEffect, useState } from 'react';
import CookieSpinner from '@/components/CookieSpinner';
import { useCartStore } from '@/store/cart';

type Status = { paid: boolean; arrived: boolean; collected: boolean; location: string };
export default function CurbsideCheckin() {
  const [token, setToken] = useState(''); const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(''); const [name, setName] = useState(''); const [vehicle, setVehicle] = useState('');
  const clearCart = useCartStore(state => state.clearCart);
  async function check(value: string) {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/curbside/status', { headers: { 'x-curbside-token': value }, cache: 'no-store' });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setStatus(data); if (data.paid) clearCart();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not check your order. Please try again.'); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    let value = window.location.hash.slice(1);
    try {
      if (value) { localStorage.setItem('chunki-curbside-checkin', `${window.location.origin}/curbside#${value}`); window.history.replaceState(null, '', '/curbside'); }
      else { const saved = localStorage.getItem('chunki-curbside-checkin'); if (saved) value = new URL(saved).hash.slice(1); }
    } catch { /* Check-in still works in this tab if browser storage is unavailable. */ }
    if (value) { setToken(value); void check(value); } else setLoading(false);
    // The token is loaded once from the checkout return or the saved check-in link.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function arrive(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch('/api/curbside/arrive', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-curbside-token': token }, body: JSON.stringify({ name, vehicle }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setStatus(previous => previous ? { ...previous, arrived: true } : previous);
    } catch (e) { setError(e instanceof Error ? e.message : 'We could not confirm your check-in. Please try again or contact the shop.'); }
    finally { setBusy(false); }
  }
  return <main className="min-h-[70vh] bg-[#f5f7fa] px-5 py-12 md:py-20"><section className="soft-card mx-auto max-w-2xl bg-white p-7 md:p-12">
    <p className="text-xs font-black uppercase tracking-[.2em] text-[#eb2327]">Curbside pickup{status ? ` · ${status.location}` : ''}</p>
    <h1 className="brand-heading mt-4 text-5xl md:text-6xl">{status?.collected ? 'ALL PICKED UP.' : status?.arrived ? 'YOU’RE CHECKED IN.' : 'PARKED? CHECK IN.'}</h1>
    {loading ? <div className="mt-8 flex items-center gap-4"><CookieSpinner size={36}/><p>Checking your order…</p></div> : !token ? <p className="mt-6 leading-7">After paying for a curbside order, return to Chunki Chip from your Square confirmation page. Your check-in link will open here. Use the same browser you ordered in, or your saved private check-in link.</p> : status?.collected ? <p className="mt-6 leading-7">Your order is marked as collected. Thank you! If you still need your cookies, please contact the shop.</p> : status?.arrived ? <p className="mt-6 leading-7">Your arrival is recorded on your Square order. Stay in your vehicle while our team brings your cookies out. If you’re still waiting, please contact the shop.</p> : status?.paid ? <><p className="mt-6 leading-7">Keep this page handy. When you’re parked outside our {status.location} shop, enter your details and tap “I’m here.” Only check in after you arrive.</p>
    <form onSubmit={arrive} className="mt-7 space-y-6"><label className="block text-sm font-bold">Name on your order<input required maxLength={100} autoComplete="name" value={name} onChange={e => setName(e.target.value)} className="soft-inset mt-2 block w-full rounded-2xl p-4 font-normal"/></label><label className="block text-sm font-bold">Vehicle or parking spot<input required maxLength={150} value={vehicle} onChange={e => setVehicle(e.target.value)} placeholder="White Honda CR-V, parked by the entrance" className="soft-inset mt-2 block w-full rounded-2xl p-4 font-normal"/></label><button disabled={busy} className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#eb2327] px-8 font-bold text-white disabled:opacity-50">{busy ? <><CookieSpinner size={24}/>Checking in…</> : 'I’m here'}</button></form></> : status ? <div className="mt-6 leading-7"><p>Your payment has not been confirmed yet. If you haven’t paid, return to your Square checkout to finish your order.</p><button onClick={() => check(token)} className="mt-5 font-bold underline">Check payment status</button></div> : null}
    {error && <div role="alert" className="mt-6 rounded-2xl bg-[#fff0f8] p-5 text-sm leading-6"><p>{error}</p>{token && <button onClick={() => check(token)} className="mt-3 font-bold underline">Try checking the order again</button>}</div>}
    <a className="mt-8 inline-block text-sm font-bold underline" href="/contact">Contact the shop</a><a className="ml-6 mt-8 inline-block text-sm font-bold underline" href="/">Back to menu</a>
    {token && <p className="mt-6 text-xs leading-5 text-black/60">Your private check-in link is saved in this browser and stays valid through your scheduled pickup. Don’t share it publicly.</p>}
  </section></main>;
}
