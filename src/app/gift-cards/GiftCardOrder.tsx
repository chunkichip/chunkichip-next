'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import CookieSpinner from '@/components/CookieSpinner';

type Design = { id: string; name: string; image: string };
type Config = { available: boolean; testMode?: boolean; designs: Design[]; applicationId?: string; locationId?: string; sandbox?: boolean };
type Card = { attach: (selector: string) => Promise<void>; destroy: () => Promise<void>; tokenize: (details: object) => Promise<{ status: string; token?: string }> };
type SquareWindow = Window & { Square?: { payments: (app: string, location: string) => { card: () => Promise<Card> } } };
type OrderStatus = { status: string; amount: number; recipientEmail: string; receiptUrl?: string };
const field = 'soft-inset mt-2 min-h-14 w-full rounded-2xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[#eb2327]';
const button = 'soft-action inline-flex min-h-14 items-center justify-center gap-3 px-7 py-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50';
const storageKey = 'chunki-gift-order';
const amountLabel = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount / 100);

async function api(path: string, body?: object, token?: string) {
  const response = await fetch(`/api/gift-cards${path}`, { cache: 'no-store', headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { 'x-gift-order-token': token } : {}) }, ...(body ? { method: 'POST', body: JSON.stringify(body) } : {}) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Please try again shortly.');
  return result;
}

export default function GiftCardOrder() {
  const [config, setConfig] = useState<Config | null>(null);
  const [designId, setDesignId] = useState('birthday');
  const [amount, setAmount] = useState('20');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState<'details' | 'payment' | 'status'>('details');
  const [busy, setBusy] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<{ id: string; token: string } | null>(null);
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const card = useRef<Card | null>(null);
  const submitting = useRef(false);
  const paymentToken = useRef<string | null>(null);
  const cents = Math.round(Number(amount) * 100);
  const selected = config?.designs.find(d => d.id === designId);

  useEffect(() => {
    api(new URLSearchParams(window.location.search).get('test') === '1' ? '/config?test=1' : '/config').then(setConfig).catch(() => setError('Could not load gift card designs. Please refresh to try again.'));
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) { const value = JSON.parse(saved); if (value.id && value.token) { setOrder(value); setStep('status'); } }
    } catch { /* Storage can be unavailable in private browsers. */ }
  }, []);

  useEffect(() => {
    if (step !== 'payment' || !config?.available || !config.applicationId || !config.locationId) return;
    let active = true;
    let attached: Card | null = null;
    setCardReady(false);
    const setup = async () => {
      const source = config.sandbox ? 'https://sandbox.web.squarecdn.com/v1/square.js' : 'https://web.squarecdn.com/v1/square.js';
      if (!(window as SquareWindow).Square) await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script'); script.src = source; script.async = true;
        script.onload = () => resolve(); script.onerror = () => reject(new Error('Could not load secure payment fields.'));
        document.head.appendChild(script);
      });
      if (!active) return;
      const square = (window as SquareWindow).Square;
      if (!square) throw new Error('Secure payments are unavailable.');
      attached = await square.payments(config.applicationId!, config.locationId!).card();
      if (!active) { await attached.destroy(); return; }
      await attached.attach('#gift-payment-card');
      card.current = attached;
      if (active) setCardReady(true);
    };
    setup().catch(reason => { if (active) setError(reason.message); });
    return () => { active = false; card.current = null; if (attached) void attached.destroy(); };
  }, [step, config]);

  useEffect(() => {
    if (step !== 'status' || !order) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    let tries = 0;
    const poll = async () => {
      try {
        const result = await api(`/orders/${order.id}`, undefined, order.token);
        if (!active) return;
        setStatus(result); setError('');
        if (['sent', 'payment_failed', 'attention'].includes(result.status)) return;
      } catch (reason) { if (active) setError(reason instanceof Error ? reason.message : 'Could not check your order.'); }
      if (active && ++tries < 40) timer = setTimeout(poll, 3000);
    };
    void poll();
    return () => { active = false; clearTimeout(timer); };
  }, [step, order, checking]);

  function review(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!Number.isFinite(cents) || cents < 500 || cents > 50000 || !/^\d+(\.\d{1,2})?$/.test(amount)) { setError('Choose an amount from $5 to $500, with up to two decimal places.'); return; }
    setStep('payment');
  }
  async function pay() {
    if (submitting.current || !card.current || !config?.available) return;
    submitting.current = true; setBusy(true); setError('');
    let pending: { id: string; token: string } | null = null;
    try {
      if (!paymentToken.current) {
        const result = await card.current.tokenize({ amount: (cents / 100).toFixed(2), currencyCode: 'USD', intent: 'CHARGE', customerInitiated: true, sellerKeyedIn: false, billingContact: { givenName: buyerName, email: buyerEmail } });
        if (result.status !== 'OK' || !result.token) throw new Error('Check your card details and complete any verification to continue.');
        paymentToken.current = result.token;
      }
      pending = order || { id: crypto.randomUUID(), token: Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2, '0')).join('') };
      await api('/orders', { ...pending, amount: cents, designId, recipientName, recipientEmail, buyerName, buyerEmail, message });
      setOrder(pending);
      try { sessionStorage.setItem(storageKey, JSON.stringify(pending)); } catch { /* The current page still holds the recovery token. */ }
      await api(`/orders/${pending.id}/pay`, { sourceId: paymentToken.current }, pending.token);
      setStep('status');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Please try again.');
      // Reuse this order and payment token on retries to prevent duplicate charges.
      if (pending) setOrder(pending);
    } finally { submitting.current = false; setBusy(false); }
  }
  function reset() {
    try { sessionStorage.removeItem(storageKey); } catch { /* optional */ }
    setOrder(null); setStatus(null); setStep('details'); setError(''); paymentToken.current = null;
  }

  return <section id="send-gift-card" className="mt-10 scroll-mt-28">
    <div className="mb-6">{config?.testMode && <p className="mb-5 rounded-2xl bg-[#ffccef] p-4 text-sm font-bold">Test checkout: use your configured test email for both sender and recipient. {config.sandbox ? 'Square Sandbox. No real charge.' : 'Production payments. Clicking Pay will charge your card and issue a real gift card.'}</p>}<p className="text-xs font-black uppercase tracking-[.2em] text-[#eb2327]">A little cookie money</p><h2 className="brand-heading mt-3 text-5xl">MAKE IT THEIRS.</h2></div>
    {!config ? <div className="soft-card flex justify-center p-12"><CookieSpinner size={48}/></div> : step === 'status' && order ? <div className="soft-card p-7 md:p-10" aria-live="polite">
      <h3 className="brand-heading text-4xl">{status?.status === 'sent' ? 'GIFT ON ITS WAY.' : status?.status === 'payment_failed' ? 'PAYMENT DECLINED.' : 'YOUR GIFT ORDER.'}</h3>
      {status?.status === 'sent' ? <><p className="mt-5 leading-7">Your {amountLabel(status.amount)} gift card email has been submitted for delivery to <strong>{status.recipientEmail}</strong>. Ask them to check their inbox and spam folder.</p>{status.receiptUrl && <a href={status.receiptUrl} target="_blank" rel="noreferrer" className="mt-5 inline-block font-bold underline">View payment receipt</a>}<div><button className={`${button} mt-6`} onClick={reset}>Send another gift</button></div></> : status?.status === 'payment_failed' ? <><p className="mt-4">The payment was declined. Your gift card has not been issued.</p><button className={`${button} mt-6`} onClick={reset}>Start a new order</button></> : <><div className="mt-6 flex items-center gap-4"><CookieSpinner size={36}/><p className="leading-7">{status?.status === 'paid' ? 'Payment confirmed. We’re preparing the gift card email.' : status?.status === 'attention' ? 'This gift order needs a delivery check. Contact Chunki Chip with the order number below.' : 'We’re checking the payment and preparing your gift. Please do not place another order for the same gift.'}</p></div><button className="mt-6 font-bold underline" onClick={() => setChecking(value => !value)}>Check order status</button></>}
      <p className="mt-6 break-all text-xs text-black/60">Order reference: {order.id}</p><p className="mt-3 text-sm text-black/65">Keep this tab open while we confirm your order. If it stays pending, contact Chunki Chip with this reference.</p>
    </div> : <div className="grid items-start gap-7 lg:grid-cols-2">
      <div className="soft-card p-6 md:p-8"><h3 className="text-lg font-black">Choose a design</h3><div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {config.designs.map((design, index) => <button type="button" key={design.id} disabled={step === 'payment'} aria-pressed={design.id === designId} aria-label={`Choose ${design.name}`} onClick={() => setDesignId(design.id)} className={`overflow-hidden rounded-2xl p-1 transition focus-visible:ring-2 focus-visible:ring-[#eb2327] ${design.id === designId ? 'bg-[#eb2327] ring-2 ring-[#eb2327]' : 'soft-inset'}`}><img src={design.image} alt={design.name} className="aspect-[1.6] w-full rounded-xl object-contain"/><span className={`block px-1 py-2 text-xs font-bold ${design.id === designId ? 'text-white' : ''}`}>{index < 2 ? design.name : `Design ${index + 1}`}</span></button>)}
      </div>{selected && <div className="soft-inset mt-7 rounded-3xl p-5"><img src={selected.image} alt={`${selected.name} preview`} className="aspect-[1.6] w-full rounded-2xl object-contain"/><div className="mt-5 flex items-center justify-between gap-3"><span className="text-sm font-bold">{recipientName ? `For ${recipientName}` : 'A gift worth sharing'}</span><strong className="text-3xl text-[#eb2327]">{Number.isFinite(cents) ? amountLabel(cents) : '$0.00'}</strong></div>{message && <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6">{message}</p>}</div>}<p className="mt-5 text-xs leading-6 text-black/60">Delivered by email after payment. Redeem at Chunki Chip with the gift card number. One recipient per purchase.</p></div>
      <div className="soft-card p-6 md:p-8">{step === 'details' ? <form onSubmit={review}>
        <fieldset><legend className="text-lg font-black">Pick an amount</legend><div className="mt-4 grid grid-cols-4 gap-2">{[5,10,20,50].map(value => <button key={value} type="button" aria-pressed={amount === String(value)} onClick={() => setAmount(String(value))} className={`min-h-12 rounded-2xl font-bold ${amount === String(value) ? 'bg-[#eb2327] text-white' : 'soft-inset'}`}>${value}</button>)}</div><label className="mt-5 block text-sm font-bold">Amount in USD<input className={field} required type="number" min="5" max="500" step="0.01" value={amount} onChange={event => setAmount(event.target.value)}/></label><p className="mt-2 text-xs text-black/60">$5 to $500</p></fieldset>
        <h3 className="mt-8 text-lg font-black">Who’s getting the good stuff?</h3><label className="mt-4 block text-sm font-bold">Recipient name<input className={field} required maxLength={100} value={recipientName} onChange={event => setRecipientName(event.target.value)} autoComplete="off"/></label><label className="mt-4 block text-sm font-bold">Recipient email<input className={field} required type="email" maxLength={254} value={recipientEmail} onChange={event => setRecipientEmail(event.target.value)} autoComplete="off"/></label>
        <h3 className="mt-8 text-lg font-black">From you</h3><label className="mt-4 block text-sm font-bold">Your name<input className={field} required maxLength={100} value={buyerName} onChange={event => setBuyerName(event.target.value)} autoComplete="name"/></label><label className="mt-4 block text-sm font-bold">Your email<input className={field} required type="email" maxLength={254} value={buyerEmail} onChange={event => setBuyerEmail(event.target.value)} autoComplete="email"/></label><label className="mt-4 block text-sm font-bold">Message (optional)<textarea className={field} rows={3} maxLength={500} value={message} onChange={event => setMessage(event.target.value)}/></label><p className="mt-2 text-right text-xs text-black/60">{message.length}/500</p>
        {config.available ? <button className={`${button} mt-6 w-full`}>Review &amp; pay · {Number.isFinite(cents) ? amountLabel(cents) : ''}</button> : <div className="mt-6 rounded-2xl bg-[#fff0f8] p-5 text-sm leading-7"><p className="font-bold">Custom checkout is being prepared.</p><p>You can preview the designs here. To send a gift card now, use our existing gift card shop.</p><a className="mt-3 inline-block font-bold underline" href="https://app.squareup.com/gift/MLGF722JEEMCW/order">Open gift card shop</a></div>}
      </form> : <div><h3 className="text-xl font-black">One last look.</h3><dl className="mt-5 space-y-4 text-sm leading-6"><div><dt className="font-bold">Gift amount</dt><dd>{amountLabel(cents)}</dd></div><div><dt className="font-bold">To</dt><dd className="break-words">{recipientName}<br/>{recipientEmail}</dd></div><div><dt className="font-bold">From</dt><dd className="break-words">{buyerName}<br/>{buyerEmail}</dd></div></dl><p className="mt-5 text-sm leading-6">Check the recipient’s email carefully. Their gift card will be emailed after payment succeeds.</p><div id="gift-payment-card" className="mt-6 min-h-32"/>{!cardReady && !error && <div className="flex items-center gap-3"><CookieSpinner size={24}/><span className="text-sm">Loading secure payment fields…</span></div>}<button type="button" onClick={pay} disabled={busy || !cardReady} className={`${button} mt-5 w-full`}>{busy ? <><CookieSpinner size={24}/> Processing payment…</> : `Pay ${amountLabel(cents)} & send gift`}</button><p className="mt-4 text-xs leading-6 text-black/60">Card details are collected securely by Square.</p>{!order && <button type="button" disabled={busy} onClick={() => { setStep('details'); setError(''); paymentToken.current = null; }} className="mt-5 text-sm font-bold underline">Edit gift details</button>}{order && <button type="button" disabled={busy} onClick={() => setStep('status')} className="mt-5 text-sm font-bold underline">Check this order before trying again</button>}</div>}</div>
    </div>}
    {error && <p role="alert" className="mt-5 rounded-2xl bg-[#fff0f8] p-5 text-sm leading-7 text-[#eb2327]">{error}</p>}
  </section>;
}
