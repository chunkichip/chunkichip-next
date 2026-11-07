'use client';

import { useEffect, useState, type FormEvent } from 'react';
import CookieSpinner from '@/components/CookieSpinner';

type Tier = { id: string; name: string; points: number };
type Program = { phoneSignInAvailable: boolean; pointName: string; rules: string[]; tiers: Tier[] };
type Account = { enrolled: boolean; balance: number; lifetimePoints: number; phoneEnding: string };
const portal = 'https://profile.squareup.com/merchantportal/MLGF722JEEMCW/loyalty';
const input = 'soft-inset mt-2 min-h-14 w-full rounded-2xl px-4 text-base outline-none focus:ring-2 focus:ring-[#eb2327]';
const action = 'soft-action inline-flex min-h-12 items-center justify-center gap-2 px-6 py-3 font-bold text-white disabled:opacity-50';

async function request(path: string, body?: object) {
  const response = await fetch(`/api/benefits/rewards/${path}`, {
    ...(body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
    cache: 'no-store',
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Please try again shortly.');
  return data;
}

export default function Rewards() {
  const [program, setProgram] = useState<Program | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    request('program').then(data => { if (active) setProgram(data); })
      .catch(reason => { if (active) setError(reason.message); })
      .finally(() => { if (active) setLoading(false); });
    request('account').then(data => { if (active) setAccount(data); }).catch(() => {});
    return () => { active = false; };
  }, []);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (sent) {
        await request('verify-code', { phone, code });
        setAccount(await request('account'));
        setCode('');
      } else {
        await request('send-code', { phone });
        setSent(true);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Please try again.');
    } finally { setBusy(false); }
  }

  async function enroll() {
    setBusy(true);
    setError('');
    try {
      await request('enroll', { consent });
      setAccount(await request('account'));
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Please try again.'); }
    finally { setBusy(false); }
  }

  async function signOut() {
    setBusy(true);
    try {
      await request('sign-out', {});
      setAccount(null);
      setPhone('');
      setSent(false);
      setConsent(false);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Please try again.'); }
    finally { setBusy(false); }
  }

  const tiers = [...(program?.tiers || [])].sort((a, b) => a.points - b.points);
  const next = account?.enrolled ? tiers.find(tier => tier.points > account.balance) : null;

  return <main className="soft-page min-h-screen px-5 py-12 text-[#171315] md:px-12 md:py-16">
    <div className="mx-auto max-w-6xl">
      <section className="soft-hero grid items-center gap-8 p-7 md:grid-cols-2 md:p-12">
        <div><p className="text-xs font-black uppercase tracking-[.2em] text-[#eb2327]">Chunki Chip Rewards</p><h1 className="brand-heading mt-4 text-6xl md:text-7xl">GOOD TASTE.<br/>GOOD PERKS.</h1><p className="mt-6 max-w-md text-base leading-7 text-black/70">Your cookie habit has benefits. Explore the rewards and keep track of your points.</p></div>
        <div className="soft-inset rounded-[2rem] p-8 text-center"><img src="/logo.png" alt="Chunki Chip" className="mx-auto h-28 w-28 object-contain"/><p className="mt-6 text-sm font-bold uppercase tracking-widest">Your next cookie starts here</p>{program?.rules.map(rule => <p key={rule} className="mt-3 text-sm leading-6">{rule}</p>)}</div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="soft-card p-6 md:p-8">
          <h2 className="brand-heading text-4xl">YOUR REWARDS</h2>
          {loading && <div className="flex justify-center py-12"><CookieSpinner size={48}/></div>}
          {account?.enrolled ? <div className="mt-6">
            <p className="text-xs font-bold text-black/60">Account ending in {account.phoneEnding}</p><p className="mt-5 text-7xl font-black text-[#eb2327]">{account.balance}</p><p className="mt-2 font-bold">{program?.pointName || 'points'} available</p>
            {next ? <div className="mt-6"><p className="text-sm leading-6">{next.points - account.balance} more points to {next.name}</p><div role="progressbar" aria-label="Progress toward next reward" aria-valuemin={0} aria-valuemax={next.points} aria-valuenow={Math.max(0, account.balance)} className="soft-inset mt-3 h-3 overflow-hidden rounded-full"><div className="h-full rounded-full bg-[#eb2327]" style={{ width: `${Math.max(0, Math.min(100, account.balance / next.points * 100))}%` }}/></div></div> : <p className="mt-6 text-sm leading-6">Explore your available rewards below.</p>}
            <p className="mt-6 text-sm leading-6 text-black/65">Use your rewards phone number at the counter or in the Rewards section of checkout. Choose an eligible reward before paying.</p><button disabled={busy} onClick={signOut} className="mt-6 text-sm font-bold underline underline-offset-4">Sign out</button>
          </div> : account ? <div className="mt-6"><p className="text-sm leading-7">Your phone is verified. Join Chunki Chip Rewards to start collecting points.</p><label className="mt-5 flex items-start gap-3 text-sm leading-6"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} className="mt-1 h-5 w-5 accent-[#eb2327]"/><span>I agree to enroll this phone number in Chunki Chip Rewards.</span></label><button disabled={!consent || busy} onClick={enroll} className={`${action} mt-6`}>{busy ? <CookieSpinner size={24}/> : 'Join rewards'}</button><button onClick={signOut} disabled={busy} className="ml-5 text-sm underline">Sign out</button></div> : !loading && program?.phoneSignInAvailable ? <form onSubmit={signIn} className="mt-6">
            <label className="block text-sm font-bold">Mobile number<input type="tel" autoComplete="tel" required disabled={sent || busy} value={phone} onChange={event => setPhone(event.target.value)} placeholder="(603) 555-0123" className={input}/></label>
            {sent ? <><p className="mt-4 text-sm leading-6">Enter the code sent to your phone.</p><label className="mt-4 block text-sm font-bold">Verification code<input autoComplete="one-time-code" inputMode="numeric" required pattern="[0-9]{4,10}" value={code} onChange={event => setCode(event.target.value)} className={input}/></label><button type="button" disabled={busy} onClick={() => { setSent(false); setCode(''); setError(''); }} className="mt-4 text-sm underline">Use another number or request a new code</button></> : <p className="mt-4 text-xs leading-6 text-black/60">We’ll text you a sign-in code. Message and data rates may apply.</p>}
            <button disabled={busy} className={`${action} mt-6`}>{busy ? <CookieSpinner size={24}/> : sent ? 'View my rewards' : 'Text me a code'}</button>
          </form> : !loading && <div className="mt-6"><p className="text-sm leading-7 text-black/70">Check your points or join the program through Square while we finish setting up phone sign-in here.</p><a href={portal} className={`${action} mt-6`}>Access my rewards</a></div>}
          {error && <p role="alert" className="mt-5 rounded-2xl bg-[#fff0f8] p-4 text-sm leading-6 text-[#eb2327]">{error}</p>}
        </div>
        <div><h2 className="brand-heading px-2 text-4xl">THE PERKS</h2><div className="mt-5 grid gap-4">
          {tiers.map(tier => <article key={tier.id} className="soft-card flex items-center gap-5 p-6"><div className="soft-inset flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full"><strong className="text-2xl text-[#eb2327]">{tier.points}</strong><span className="text-[10px] font-bold uppercase">points</span></div><div><h3 className="text-lg font-black">{tier.name}</h3>{account?.enrolled && account.balance >= tier.points && <p className="mt-2 inline-block rounded-full bg-[#ffccef] px-3 py-1 text-xs font-bold">Available with your points</p>}</div></article>)}
          {!loading && tiers.length === 0 && <div className="soft-card p-6 text-sm leading-7">View the current earning rules and rewards in your Square rewards account.</div>}
        </div></div>
      </section>
    </div>
  </main>;
}
