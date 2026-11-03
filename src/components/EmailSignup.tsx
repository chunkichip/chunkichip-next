'use client';
import { useState } from 'react';
import ManagedText from './ManagedText';
export default function EmailSignup() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');
  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (busy || success) return;
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/customers/subscribe`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Could not sign you up. Please try again.');
      setSuccess(true); setEmail(''); setMessage('You’re on the list. Thanks for signing up!');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not sign you up. Please try again.');
    } finally { setBusy(false); }
  }
  return <section id="email-signup" aria-labelledby="email-signup-heading" className="px-5 py-12 md:px-12">
    <div className="soft-hero mx-auto grid max-w-[1400px] items-center gap-8 bg-[#ffccef] p-7 md:grid-cols-2 md:p-10">
      <div><h2 id="email-signup-heading" className="brand-heading text-5xl"><ManagedText id="signup-heading" fallback="GET THE COOKIE EMAILS." /></h2><p className="mt-4 max-w-lg text-sm leading-7"><ManagedText id="signup-description" fallback="Weekly flavors, shop news, and Chunki Chip updates. Straight to your inbox." /></p></div>
      <form onSubmit={subscribe} className="grid gap-3">
        <label htmlFor="signup-email" className="text-sm font-bold">Email address</label>
        <input id="signup-email" type="email" autoComplete="email" required maxLength={254} disabled={busy || success} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="min-h-14 w-full rounded-xl border border-black/20 bg-white px-4 text-base"/>
        <button type="submit" disabled={busy || success} className="min-h-14 rounded-xl bg-[#eb2327] px-6 font-bold text-white disabled:opacity-60">{success ? 'You’re signed up' : busy ? 'Signing up…' : 'Sign up for emails'}</button>
        <p className="text-xs leading-5">By signing up, you agree to receive marketing emails from Chunki Chip. Unsubscribe anytime. <a href="/privacy" className="underline">Privacy policy</a></p>
        <p role="status" aria-live="polite" className="text-sm font-semibold">{message}</p>
      </form>
    </div>
  </section>;
}
