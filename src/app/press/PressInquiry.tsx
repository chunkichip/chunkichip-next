'use client';

import { useState, type FormEvent } from 'react';

export default function PressInquiry() {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/press-inquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Please email press@chunkichip.com directly.');
      setSent(true);
    } catch (error) { setError(error instanceof Error ? error.message : 'Please try again or email press@chunkichip.com directly.'); }
    finally { setBusy(false); }
  }
  const input = 'mt-2 min-h-12 w-full rounded-2xl border border-black/20 bg-white px-4 py-3 text-base font-normal';
  if (sent) return <div role="status" className="mt-7 rounded-2xl bg-[#ffccef]/50 p-6"><h3 className="brand-heading text-3xl">INQUIRY SENT.</h3><p className="mt-2">Thanks for reaching out. Our team will review your request and reply by email.</p></div>;
  return <form onSubmit={submit} className="mt-7 space-y-5" aria-label="Press inquiry">
    <fieldset disabled={busy} className="grid gap-5 sm:grid-cols-2">
      <legend className="sr-only">Your inquiry details</legend>
      <label className="font-bold">Name<input name="name" required maxLength={120} autoComplete="name" className={input}/></label>
      <label className="font-bold">Email<input name="email" type="email" required maxLength={254} autoComplete="email" className={input}/></label>
      <label className="font-bold">Outlet or organization<input name="outlet" required maxLength={200} autoComplete="organization" className={input}/></label>
      <label className="font-bold">Deadline <span className="font-normal">(optional)</span><input name="deadline" type="date" className={input}/></label>
      <label className="font-bold sm:col-span-2">What are you working on?<textarea name="message" required maxLength={5000} rows={6} className={input} placeholder="Tell us about your story, interview, or photography request."/></label>
      <div hidden aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
    </fieldset>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <button type="submit" disabled={busy} className="soft-action inline-flex min-h-12 items-center px-7 py-3 font-bold text-white disabled:opacity-60">{busy ? 'Sending…' : 'Send inquiry'}</button>
    <p className="text-sm text-black/60">We’ll use your information to respond to your inquiry.</p>
  </form>;
}
