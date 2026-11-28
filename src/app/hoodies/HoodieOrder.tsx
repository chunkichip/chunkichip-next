'use client';
import { useRef, useState } from 'react';
import HoodieGallery from './HoodieGallery';
const sizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
export default function HoodieOrder() {
  const [size, setSize] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const attempt = useRef(''); const previous = useRef('');
  const price = size === '2XL' || size === '3XL' ? '49.99' : '39.99';
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const fields = new FormData(event.currentTarget);
    const body = { size, name: String(fields.get('name') || ''), email: String(fields.get('email') || ''), phone: String(fields.get('phone') || ''), acknowledged: fields.get('acknowledged') === 'on' };
    if (!size) { setError('Please choose a hoodie size.'); return; }
    const fingerprint = JSON.stringify(body);
    if (previous.current !== fingerprint || !attempt.current) { attempt.current = crypto.randomUUID(); previous.current = fingerprint; }
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/hoodies/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, attemptId: attempt.current }) });
      const data = await response.json(); if (!response.ok || !data.url) throw new Error(data.error || 'Could not open checkout. Please retry.');
      window.location.assign(data.url);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not open checkout. Please retry.'); setBusy(false); }
  }
  return <main className="soft-page min-h-screen px-5 py-10 text-[#171315] md:px-12 md:py-16">
    <div className="mx-auto max-w-[1200px]">
      <a href="/" className="text-base font-bold underline underline-offset-4">← Back to the shop</a>
      <div className="mt-8 grid items-start gap-9 lg:grid-cols-2 lg:gap-14">
        <div><p className="text-sm font-black uppercase tracking-[.22em] text-[#eb2327]">Chunki Chip merch</p><h1 className="brand-heading mt-3 text-6xl leading-tight md:text-7xl">YOUR NEW<br/>COOKIE HOODIE.</h1><HoodieGallery/></div>
        <form onSubmit={submit} className="soft-card bg-white p-6 md:p-8">
          <h2 className="brand-heading text-4xl">CHUNKI CHIP HOODIE</h2>
          <p className="mt-3 text-lg">Black hoodie. Red and pink Chunki Chip logo.</p>
          <p className="mt-5 text-3xl font-black">{size ? `$${price}` : 'From $39.99'}</p>
          <p className="mt-2 text-base text-black/65">XS–XL $39.99 · 2XL–3XL $49.99</p>
          <div className="soft-inset mt-6 p-5"><h3 className="font-bold">Pickup when it’s ready.</h3><p className="mt-2 leading-7">Please allow 1–7 days. We’ll contact you when your hoodie is ready. Wait for that message before coming in.</p><p className="mt-3 text-base">Milford pickup only<br/>183 Elm St, Unit 8, Milford, NH</p></div>
          <fieldset disabled={busy} className="mt-7"><legend className="text-lg font-bold">Choose your size <span className="text-[#eb2327]">*</span></legend><div className="mt-3 flex flex-wrap gap-3">{sizes.map(value => <label key={value} className={`flex min-h-12 min-w-14 cursor-pointer items-center justify-center rounded-full border-2 px-4 font-bold focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#eb2327] ${size === value ? 'border-[#eb2327] bg-[#eb2327] text-white' : 'border-[#e6e8ec] bg-white'}`}><input className="sr-only" type="radio" name="size" value={value} required checked={size === value} onChange={() => setSize(value)}/>{value}</label>)}</div></fieldset>
          <fieldset disabled={busy} className="mt-7 space-y-5"><legend className="mb-4 text-lg font-bold">Your pickup details</legend>
            <label className="block font-bold" htmlFor="hoodie-name">Pickup name <span className="text-[#eb2327]">*</span><input id="hoodie-name" name="name" autoComplete="name" required maxLength={100} className="soft-inset mt-2 min-h-14 w-full px-5 text-base font-normal"/></label>
            <label className="block font-bold" htmlFor="hoodie-phone">Mobile number <span className="text-[#eb2327]">*</span><input id="hoodie-phone" name="phone" type="tel" autoComplete="tel" required maxLength={30} className="soft-inset mt-2 min-h-14 w-full px-5 text-base font-normal"/></label>
            <label className="block font-bold" htmlFor="hoodie-email">Email address <span className="text-[#eb2327]">*</span><input id="hoodie-email" name="email" type="email" autoComplete="email" required maxLength={254} className="soft-inset mt-2 min-h-14 w-full px-5 text-base font-normal"/></label>
            <label className="flex cursor-pointer items-start gap-3 leading-6"><input name="acknowledged" type="checkbox" required className="mt-1 h-5 w-5 shrink-0 accent-[#eb2327]"/><span>I understand pickup takes 1–7 days and I’ll wait until Chunki Chip contacts me that it’s ready.</span></label>
          </fieldset>
          {error && <p role="alert" className="mt-5 rounded-2xl border-2 border-[#eb2327] p-4 font-bold text-[#b21c20]">{error}</p>}
          <button disabled={busy} type="submit" className="soft-action mt-7 flex min-h-16 w-full items-center justify-center rounded-full px-5 text-lg font-bold text-white disabled:opacity-60">{busy ? 'Opening secure checkout…' : `Order hoodie · $${price}`}</button>
          <p className="mt-4 text-base leading-6 text-black/65">Pay securely through Square. Hoodies are ordered separately from cookies. All contact fields are required.</p>
        </form>
      </div>
    </div>
  </main>;
}
