'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Check, RotateCcw } from 'lucide-react';

type Status = { enabled: boolean; week_start: string; resets_at: string };
type VoteContext = { enabled: boolean; selected: string[]; submitted: boolean; busy: boolean; toggle: (name: string) => void; panel: ReactNode };
const VotingContext = createContext<VoteContext | null>(null);

export function ArchiveVotingProvider({ names, children }: { names: string[]; children: ReactNode }) {
  const client = useRef<SupabaseClient | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    let subscription: { unsubscribe: () => void } | undefined;
    async function initialize() {
      try {
        const response = await fetch('/api/archive-voting-config', { cache: 'no-store' });
        if (!response.ok) throw new Error('Configuration unavailable');
        const config = await response.json();
        if (!config.configured || !active) return;
        const supabase = createClient(config.url, config.publishableKey);
        client.current = supabase;
        const { data: votingStatus, error: statusError } = await supabase.rpc('archive_voting_status');
        if (statusError || !active) return;
        setStatus(votingStatus);
        async function loadBallot() {
          const { data: { user } } = await supabase.auth.getUser();
          if (!active) return;
          setVerifiedEmail(user?.email || '');
          if (!user) return;
          const { data: ballot } = await supabase.from('archive_ballots').select('choices').eq('week_start', votingStatus.week_start).maybeSingle();
          if (ballot && active) { setSelected(ballot.choices); setSubmitted(true); }
        }
        await loadBallot();
        subscription = supabase.auth.onAuthStateChange(() => { setTimeout(() => { if (active) void loadBallot(); }, 0); }).data.subscription;
      } catch { /* Voting stays closed when setup or the service is unavailable. */ }
      finally { if (active) setLoaded(true); }
    }
    void initialize();
    return () => { active = false; subscription?.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  function toggle(name: string) {
    if (!status?.enabled || submitted || busy || !names.includes(name)) return;
    setError('');
    setSelected((values) => {
      if (values.includes(name)) return values.filter((value) => value !== name);
      if (values.length === 3) return values;
      return [...values, name];
    });
  }

  async function sendCode(event: FormEvent) {
    event.preventDefault();
    if (!client.current || cooldown || busy || !selected.length) return;
    setBusy(true); setError('');
    try {
      const { error: authError } = await client.current.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } });
      if (authError) {
        if (authError.code === 'email_address_not_authorized') throw new Error('Email verification is not available for customers yet. Please try again later.');
        if (authError.status === 429) throw new Error('Please wait a minute before requesting another email.');
        throw new Error('We could not send your code. Check your email address and try again.');
      }
      setCodeSent(true); setCooldown(60);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not send your code.'); }
    finally { setBusy(false); }
  }

  async function submitVote(event: FormEvent) {
    event.preventDefault();
    if (!client.current || !selected.length || submitted || busy) return;
    setBusy(true); setError('');
    try {
      if (!verifiedEmail) {
        const { error: verifyError } = await client.current.auth.verifyOtp({ email: email.trim(), token: token.trim(), type: 'email' });
        if (verifyError) throw new Error('That code is invalid or expired. Check your email or request a new code.');
      }
      const { data, error: voteError } = await client.current.rpc('submit_archive_ballot', { p_choices: selected });
      if (voteError) {
        if (voteError.message.includes('already voted')) {
          const { data: ballot } = await client.current.from('archive_ballots').select('choices').eq('week_start', status!.week_start).maybeSingle();
          if (ballot) { setSelected(ballot.choices); setSubmitted(true); return; }
        }
        throw new Error(voteError.message.includes('closed') ? 'Comeback voting is currently closed.' : 'Your vote could not be saved. Please try again.');
      }
      if (!data?.saved) throw new Error('Your vote could not be saved. Please try again.');
      setSelected(data.choices); setSubmitted(true); setToken('');
    } catch (err) { setError(err instanceof Error ? err.message : 'Your vote could not be saved.'); }
    finally { setBusy(false); }
  }

  const panel = (
      <section id="comeback-vote" className="soft-card mt-8 scroll-mt-32 bg-white p-6 md:p-8" aria-labelledby="comeback-heading">
        <p className="text-xs font-black uppercase tracking-[.2em] text-[#eb2327]">Have a favorite you miss?</p>
        <h2 id="comeback-heading" className="brand-heading mt-3 text-4xl">BRING IT BACK</h2>
        {!status?.enabled ? <p className="mt-4 text-sm leading-7 text-black/65">{loaded ? 'Comeback voting opens soon. Save your favorites while you browse.' : 'Checking comeback voting…'}</p> : <>
          <p className="mt-4 text-sm leading-7 text-black/65">Pick up to three flavors below, then submit your weekly vote. Verify your email with a one-time code. Voting resets Mondays at midnight Eastern. Your picks help guide future rotations.</p>
          {submitted ? <div role="status" className="mt-5 rounded-2xl bg-[#fff1fa] p-5"><p className="flex items-center gap-2 font-bold text-[#a20f16]"><Check size={20} />Your vote is in.</p><p className="mt-3 text-sm leading-7">{selected.join(' · ')}</p><p className="mt-3 text-sm text-black/60">Come back next week to vote again.</p></div> : <>
            <div className="mt-5 text-sm" aria-live="polite"><p className="font-bold">{selected.length} of 3 selected</p>{selected.length > 0 && <ul className="mt-3 flex flex-wrap gap-2">{selected.map((name) => <li key={name}><button type="button" disabled={busy} onClick={() => toggle(name)} aria-label={`Remove ${name} from vote`} className="min-h-11 rounded-full bg-[#ffccef] px-4 py-2 font-semibold text-[#651016]">{name} ×</button></li>)}</ul>}</div>
            {!selected.length ? <p className="mt-4 text-sm text-black/60">Tap “Bring it back” on a flavor to choose it.</p> : <div className="mt-5 max-w-xl">
              {!verifiedEmail && !codeSent && <form onSubmit={sendCode} className="space-y-3"><label htmlFor="vote-email" className="block text-sm font-bold">Your email</label><input id="vote-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy} className="soft-inset min-h-12 w-full rounded-xl border border-black/15 bg-white px-4" /><p className="text-xs leading-6 text-black/60">Used to verify your vote. This does not sign you up for marketing emails.</p><button type="submit" disabled={busy || cooldown > 0} className="soft-action min-h-12 rounded-full px-6 py-3 font-bold text-white disabled:opacity-50">{busy ? 'Sending…' : 'Send verification code'}</button></form>}
              {(codeSent || verifiedEmail) && <form onSubmit={submitVote} className="space-y-3">
                {verifiedEmail ? <p className="text-sm">Voting as {verifiedEmail}</p> : <><label htmlFor="vote-code" className="block text-sm font-bold">Code sent to {email.trim()}</label><input id="vote-code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" minLength={6} maxLength={10} required value={token} onChange={(event) => setToken(event.target.value.replace(/\D/g, ''))} disabled={busy} className="soft-inset min-h-12 w-full rounded-xl border border-black/15 bg-white px-4" /><div className="flex flex-wrap gap-4"><button type="button" disabled={busy || cooldown > 0} onClick={sendCode} className="min-h-11 text-sm font-bold text-[#eb2327] disabled:opacity-50">{cooldown ? `Resend in ${cooldown}s` : 'Resend code'}</button><button type="button" disabled={busy} onClick={() => { setCodeSent(false); setToken(''); setError(''); }} className="min-h-11 text-sm underline">Change email</button></div></>}
                <p className="text-xs leading-6 text-black/60">Your choices are final once submitted for this week.</p><button type="submit" disabled={busy} className="soft-action min-h-12 rounded-full px-6 py-3 font-bold text-white disabled:opacity-50">{busy ? 'Saving your vote…' : 'Submit my vote'}</button>
              </form>}
            </div>}
            {error && <p role="alert" className="mt-4 text-sm text-[#a20f16]">{error}</p>}
          </>}
        </>}
      </section>
  );
  const value = { enabled: Boolean(status?.enabled), selected, submitted, busy, toggle, panel };
  return (
    <VotingContext.Provider value={value}>
      {children}
      {status?.enabled && selected.length > 0 && !submitted && <a href="#comeback-vote" className="soft-action fixed bottom-5 left-1/2 z-50 flex min-h-12 -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg">Review my vote ({selected.length}/3)</a>}
    </VotingContext.Provider>
  );
}

export function ComebackButton({ name }: { name: string }) {
  const context = useContext(VotingContext);
  if (!context?.enabled) return null;
  const chosen = context.selected.includes(name);
  return <button type="button" aria-pressed={chosen} disabled={context.busy || context.submitted || (!chosen && context.selected.length >= 3)} onClick={() => context.toggle(name)} className={`mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#eb2327] disabled:opacity-50 ${chosen ? 'border-[#eb2327] bg-[#fff1fa] text-[#a20f16]' : 'border-black/15 bg-white text-[#eb2327]'}`}><RotateCcw size={17} aria-hidden="true" />{chosen ? context.submitted ? 'Voted' : 'Selected for vote' : 'Bring it back'}</button>;
}

export function ArchiveVotePanel() {
  return useContext(VotingContext)?.panel ?? null;
}
