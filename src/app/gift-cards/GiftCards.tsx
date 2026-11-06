'use client';

import { useState, type FormEvent } from 'react';
import CookieSpinner from '@/components/CookieSpinner';

type Balance = { lastFour: string; amount: number; currency: string; state: string };
const giftShop = 'https://app.squareup.com/gift/MLGF722JEEMCW';

export default function GiftCards() {
  const [number, setNumber] = useState('');
  const [balance, setBalance] = useState<Balance | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function checkBalance(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setBalance(null);
    try {
      const response = await fetch('/api/benefits/gift-cards/balance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number }), cache: 'no-store',
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Please try again.');
      setBalance(result);
      setNumber('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  return <main className="soft-page min-h-screen px-5 py-12 text-[#171315] md:px-12 md:py-16"><div className="mx-auto max-w-6xl">
    <section className="soft-hero grid items-center gap-10 p-7 md:grid-cols-2 md:p-12">
      <div><p className="text-xs font-black uppercase tracking-[.2em] text-[#eb2327]">Chunki Chip Gift Cards</p><h1 className="brand-heading mt-4 text-6xl md:text-7xl">GIVE GOOD<br/>TASTE.</h1><p className="mt-6 max-w-md text-base leading-7 text-black/70">For birthdays, thank-yous, and people who deserve a cookie. Send a Chunki Chip eGift card straight to their inbox.</p><a href={giftShop} className="soft-action mt-7 inline-flex min-h-14 items-center justify-center px-7 py-4 font-bold text-white">Send a gift card</a><p className="mt-3 text-xs leading-6 text-black/60">Choose your amount, personalize your gift, and complete your purchase through Square.</p></div>
      <div className="soft-inset rounded-[2rem] p-6 md:p-9"><div className="relative mx-auto flex aspect-[1.58] max-w-md flex-col justify-between overflow-hidden rounded-3xl bg-[#eb2327] p-7 text-white shadow-xl"><div className="flex items-center justify-between gap-4"><img src="/logo.png" alt="Chunki Chip" className="h-16 w-16 rounded-full bg-white object-contain"/><span className="text-xs font-bold uppercase tracking-[.18em]">Gift Card</span></div><p className="brand-heading mt-8 text-4xl text-[#ffccef] md:text-5xl">OH, THAT’S<br/>A GOOD GIFT.</p></div></div>
    </section>
    <section className="mt-10 grid gap-6 md:grid-cols-2">
      <div className="soft-card p-6 md:p-8"><p className="text-xs font-black uppercase tracking-[.18em] text-[#eb2327]">Already have one?</p><h2 className="brand-heading mt-3 text-4xl">CHECK YOUR BALANCE</h2><form onSubmit={checkBalance} className="mt-6"><label className="block text-sm font-bold">Gift card number<input required inputMode="numeric" autoComplete="off" maxLength={23} value={number} onChange={event => { setNumber(event.target.value); setBalance(null); setError(''); }} placeholder="16-digit card number" className="soft-inset mt-2 min-h-14 w-full rounded-2xl px-4 text-base outline-none focus:ring-2 focus:ring-[#eb2327]"/></label><button disabled={busy} className="soft-action mt-5 inline-flex min-h-12 items-center justify-center gap-2 px-6 py-3 font-bold text-white disabled:opacity-50">{busy ? <CookieSpinner size={24}/> : 'Check balance'}</button></form>
        {balance && <div aria-live="polite" className="soft-inset mt-6 rounded-2xl p-5"><p className="text-xs font-bold text-black/60">Card ending in {balance.lastFour}</p><p className="mt-3 text-4xl font-black text-[#eb2327]">{new Intl.NumberFormat('en-US', { style: 'currency', currency: balance.currency }).format(balance.amount / 100)}</p><p className="mt-2 text-sm">{balance.state === 'ACTIVE' ? 'Available balance' : `Card status · ${balance.state.toLowerCase().replaceAll('_', ' ')}`}</p></div>}
        {error && <p role="alert" className="mt-5 rounded-2xl bg-[#fff0f8] p-4 text-sm leading-6 text-[#eb2327]">{error}</p>}
      </div>
      <div className="soft-card p-6 md:p-8"><h2 className="brand-heading text-4xl">SOMEONE’S<br/>DAY, MADE.</h2><div className="mt-6 space-y-6 text-sm leading-7"><div><h3 className="font-black">Make it theirs</h3><p className="mt-1 text-black/65">Pick an amount and add a personal message when you send your eGift card.</p></div><div><h3 className="font-black">Delivered by email</h3><p className="mt-1 text-black/65">Square sends the eGift card to your recipient after your purchase.</p></div><div><h3 className="font-black">Bring it to Chunki Chip</h3><p className="mt-1 text-black/65">Have your gift card number ready when you visit the shop.</p></div></div></div>
    </section>
  </div></main>;
}
