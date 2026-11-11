'use client';
import { useEffect, useRef, useState } from 'react';
import CookieSpinner from '@/components/CookieSpinner';
import { useCartStore } from '@/store/cart';

type Order = { id: string; status: string; amount: number; reserved: number; remaining: number; giftApplied: boolean; needsRecovery: boolean; contact: { name: string; email: string; phone: string } | null; locationId: string; location: string; method: string; pickupAt?: string; receiptUrl?: string; curbsideToken?: string; expiresAt: string };
type Config = { available: boolean; applicationId: string; sandbox: boolean };
type PaymentForm = { attach: (selector: string) => Promise<void>; destroy: () => Promise<void>; tokenize: (details?: object) => Promise<{ status: string; token?: string }> };
type SquareGlobal = Window & { Square?: { payments: (app: string, location: string) => { card: () => Promise<PaymentForm>; giftCard: () => Promise<PaymentForm> } } };
const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const button = 'inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#eb2327] px-7 font-bold text-white disabled:opacity-50';
export default function CookieCheckout() {
 const [session, setSession] = useState<{ id: string; token: string } | null>(null);
 const [order, setOrder] = useState<Order | null>(null); const [config, setConfig] = useState<Config | null>(null);
 const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [ready, setReady] = useState(false);
 const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [phone, setPhone] = useState('');
 const [fieldsError, setFieldsError] = useState(''); const [fieldAttempt, setFieldAttempt] = useState(0);
 const forms = useRef<{ gift?: PaymentForm; card?: PaymentForm }>({});
 const clearCart = useCartStore(state => state.clearCart);
 const ref = useRef<{ id: string; token: string } | null>(null);
 async function call(action = '', body?: object) {
  const value = ref.current; if (!value) throw new Error('Open your private checkout link to continue.');
  const response = await fetch(`/api/cookie-checkout/${value.id}${action ? `/${action}` : ''}`, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', 'x-checkout-token': value.token }, ...(body ? { body: JSON.stringify(body) } : {}), cache: 'no-store' });
  const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Could not update checkout.'); return data as Order;
 }
 async function refresh() { try { const data = await call(); setOrder(data); if (data.status === 'paid') setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'Could not check the order.'); } }
 useEffect(() => {
  let raw = window.location.hash.slice(1);
  try { if (raw) { sessionStorage.setItem('chunki-cookie-checkout', raw); window.history.replaceState(null, '', '/checkout'); } else raw = sessionStorage.getItem('chunki-cookie-checkout') || ''; } catch {}
  const [id, token] = raw.split('.');
  if (!id || !token) { setError('Your checkout link is missing. Return to your bag to start checkout.'); return; }
  ref.current = { id, token }; setSession(ref.current);
  void refresh(); fetch('/api/cookie-checkout/config', { cache: 'no-store' }).then(r => r.json()).then(data => { setConfig(data); if (!data.available) setError('Gift card checkout is temporarily unavailable. Cancel this checkout and use regular checkout.'); }).catch(() => setError('Secure payment fields could not load. Please refresh.'));
  // Load the private recovery credential once.
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);
 useEffect(() => {
  if (order?.status !== 'paying') return;
  const interval = setInterval(refresh, 3000); return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [order?.status]);
 useEffect(() => {
  if (order?.status === 'paid') { clearCart(); if (order.curbsideToken) { try { localStorage.setItem('chunki-curbside-checkin', `${window.location.origin}/curbside#${order.curbsideToken}`); } catch {} } }
 }, [order?.status, order?.curbsideToken, clearCart]);
 const hasContact = Boolean(order?.contact);
 useEffect(() => {
  if (!hasContact || order?.status !== 'open' || !config?.available || order.needsRecovery) return;
  if (!order.locationId) { setFieldsError('We could not load the shop details. Refresh your order, then retry the payment fields.'); return; }
  let active = true; const attached: PaymentForm[] = []; setReady(false); setFieldsError('');
  const timeout = setTimeout(() => { if (active) setFieldsError('The secure payment fields are taking too long to load. Check your connection and retry.'); }, 20000);
  void (async () => {
   const host = config.sandbox ? 'https://sandbox.web.squarecdn.com/v1/square.js' : 'https://web.squarecdn.com/v1/square.js';
   if (!(window as SquareGlobal).Square) await new Promise<void>((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>(`script[src="${host}"]`);
    if (!script) { script = document.createElement('script'); script.src = host; document.head.appendChild(script); }
    script.addEventListener('load', () => resolve(), { once: true }); script.addEventListener('error', () => reject(new Error('Could not load secure payment fields.')), { once: true });
   });
   const sdk = (window as SquareGlobal).Square; if (!sdk) throw new Error('Secure payment fields are unavailable.');
   const payments = sdk.payments(config.applicationId, order.locationId);
   const kind = order.giftApplied ? 'card' : 'gift';
   const form = kind === 'gift' ? await payments.giftCard() : await payments.card(); attached.push(form);
   if (!active) { await form.destroy(); return; }
   await form.attach(kind === 'gift' ? '#cookie-gift-card' : '#cookie-payment-card');
   if (active) { clearTimeout(timeout); setFieldsError(''); forms.current = { [kind]: form }; setReady(true); }
  })().catch(e => { clearTimeout(timeout); if (active) setFieldsError(e instanceof Error ? e.message : 'Could not load payment fields.'); });
  return () => { active = false; clearTimeout(timeout); setReady(false); forms.current = {}; attached.forEach(form => { void form.destroy().catch(() => {}); }); };
 }, [fieldAttempt, hasContact, order?.needsRecovery, order?.status, order?.giftApplied, order?.locationId, config?.applicationId, config?.available, config?.sandbox]);
 async function action(path: string, body: object) {
  setBusy(true); setError('');
  try { setOrder(await call(path, body)); }
  catch (e) { setError(e instanceof Error ? e.message : 'Could not update checkout.'); await refresh(); }
  finally { setBusy(false); }
 }
 async function pay(kind: 'gift' | 'card') {
  if (!order) return; setBusy(true); setError('');
  try {
   const result = await forms.current[kind]?.tokenize(kind === 'card' ? { amount: (order.remaining / 100).toFixed(2), currencyCode: 'USD', intent: 'CHARGE', customerInitiated: true, sellerKeyedIn: false, billingContact: { givenName: order.contact?.name, email: order.contact?.email, phone: order.contact?.phone, countryCode: 'US' } } : undefined);
   if (result?.status !== 'OK' || !result.token) throw new Error('Check the payment details and complete any verification to continue.');
   setOrder(await call('payment', { kind, sourceId: result.token, attemptId: crypto.randomUUID() }));
  } catch (e) { setError(e instanceof Error ? e.message : 'Could not confirm payment. Check your order before trying again.'); await refresh(); }
  finally { setBusy(false); }
 }
 return <main className="min-h-[70vh] bg-[#f5f7fa] px-5 py-12 md:py-20"><section className="soft-card mx-auto max-w-3xl bg-white p-7 md:p-12">
  <p className="text-xs font-black uppercase tracking-[.2em] text-[#eb2327]">Chunki Chip · Secure checkout</p><h1 className="brand-heading mt-4 text-5xl md:text-6xl">{order?.status === 'paid' ? 'COOKIES, PAID FOR.' : 'PUT IT ON YOUR GIFT CARD.'}</h1>
  {order && <p className="mt-5 text-sm font-bold">{order.location} · {order.method === 'shipping' ? 'Nationwide shipping' : order.method === 'curbside' ? 'Curbside pickup' : 'Carry out'}</p>}
  {order?.pickupAt && <p className="mt-4 rounded-2xl bg-[#ffccef] p-4 font-bold">Pickup: {new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'long',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(new Date(order.pickupAt))}</p>}
  {error && <p role="alert" className="mt-6 rounded-2xl bg-[#fff0f8] p-4 text-sm leading-6">{error}</p>}
  {!order && session && !error && <div className="mt-8"><CookieSpinner size={40}/></div>}
  {order?.status === 'paid' ? <><p className="mt-6 leading-7">Your {dollars(order.amount)} order is paid. Thank you!{order.method === 'shipping' ? ' Your cookies will be shipped to the address you provided.' : ' Our team can now prepare your cookies.'}</p>{order.receiptUrl && <a className="mt-5 inline-block font-bold underline" href={order.receiptUrl} target="_blank" rel="noreferrer">View Square receipt</a>}{order.curbsideToken && <a className={`${button} mt-6 block w-fit`} href={`/curbside#${order.curbsideToken}`}>Curbside check-in</a>}</> : order?.status === 'paying' ? <div className="mt-8 flex items-center gap-4"><CookieSpinner size={36}/><p>Confirming your payment. Please keep this page open and don’t place another order.</p></div> : order && order.status !== 'open' ? <p className="mt-6 leading-7">{order.status === 'canceled' ? 'This checkout is canceled. Payment authorizations have been released. You can return to your bag and start again.' : 'This checkout needs a payment review. Please contact the shop with the reference below.'}</p> : order ? <>
   <dl className="soft-inset mt-7 space-y-3 rounded-2xl p-5"><div className="flex justify-between gap-4"><dt>Order total, including tax and shipping where applicable</dt><dd className="font-bold">{dollars(order.amount)}</dd></div>{order.reserved > 0 && <div className="flex justify-between"><dt>Gift card/payment authorized</dt><dd>{dollars(order.reserved)}</dd></div>}<div className="flex justify-between text-xl font-black"><dt>Remaining</dt><dd>{dollars(order.remaining)}</dd></div></dl>
   {!order.contact ? <form className="mt-7 space-y-5" onSubmit={e => { e.preventDefault(); void action('contact', { name, email, phone }); }}><h2 className="text-xl font-black">Your order details</h2>{[['Name', name, setName, 'text'], ['Email for your receipt', email, setEmail, 'email'], ['Mobile number', phone, setPhone, 'tel']].map(([label, value, setter, type]) => <label key={String(label)} className="block text-sm font-bold">{String(label)}<input required maxLength={type === 'text' ? 100 : type === 'tel' ? 25 : 254} type={String(type)} value={String(value)} onChange={e => (setter as (value: string) => void)(e.target.value)} className="soft-inset mt-2 block w-full rounded-2xl p-4 font-normal"/></label>)}<button disabled={busy} className={button}>Continue to payment</button></form> : <>
    <p className="mt-6 text-sm leading-6">Order for {order.contact.name} · {order.contact.email}</p>
    {order.needsRecovery ? <div className="mt-6 rounded-2xl bg-[#fff0f8] p-5"><p className="text-sm leading-6">A payment attempt needs checking before another can be made. Release that unconfirmed attempt, then try again. Any gift card already applied below stays on this order.</p><button disabled={busy} onClick={() => action('recover', {})} className={`${button} mt-4`}>Release unconfirmed attempt</button></div> : <>
     <div className={order.giftApplied ? 'hidden' : 'mt-7'}><h2 className="text-xl font-black">Chunki Chip gift card</h2><div id="cookie-gift-card" className="mt-5 min-h-16"/><button disabled={busy || !ready} onClick={() => pay('gift')} className={`${button} mt-4`}>Apply gift card{order.remaining === order.amount ? ` · up to ${dollars(order.remaining)}` : ''}</button></div>
     <div className={order.giftApplied && order.remaining > 0 ? 'mt-8' : 'hidden'}><h2 className="text-xl font-black">Pay the remaining {dollars(order.remaining)}</h2><div id="cookie-payment-card" className="mt-5 min-h-32"/><button disabled={busy || !ready} onClick={() => pay('card')} className={`${button} mt-4`}>Pay {dollars(order.remaining)} & place order</button></div>
     {!ready && !fieldsError && <div className="mt-5 flex items-center gap-3"><CookieSpinner size={24}/><span className="text-sm">Loading secure payment fields…</span></div>}
     {fieldsError && <div role="alert" className="mt-5 rounded-2xl bg-[#fff0f8] p-4 text-sm leading-6"><p>{fieldsError}</p><button disabled={busy} onClick={async () => { await refresh(); setFieldAttempt(value => value + 1); }} className="mt-3 font-bold underline">Retry secure payment fields</button></div>}
     {order.remaining === 0 && <button disabled={busy} onClick={() => action('complete', {})} className={`${button} mt-6`}>Complete order</button>}
     <p className="mt-5 text-xs leading-6 text-black/65">Applying a gift card authorizes its available balance up to your order total. If it covers the full order, your order is placed immediately. Otherwise, pay the remainder by credit or debit card to finish. Canceling releases any unused authorization; unfinished checkouts expire after 30 minutes.</p>
    </>}
   </>}
   <p className="mt-6 text-xs leading-6 text-black/65">Coupon codes and reward redemption are available through regular Square checkout. To switch, cancel this checkout first.</p><button disabled={busy} onClick={() => action('cancel', {})} className="mt-5 text-sm font-bold underline">Cancel checkout & release authorizations</button>
  </> : null}
  {order && <><p className="mt-8 break-all text-xs text-black/55">Order reference: {order.id}</p><button disabled={busy} onClick={refresh} className="mt-3 text-sm font-bold underline">Check order status</button></>}
  <div className="mt-8 flex gap-6 text-sm font-bold"><a className="underline" href="/">Back to menu</a><a className="underline" href="/contact">Contact the shop</a></div>
 </section></main>;
}
