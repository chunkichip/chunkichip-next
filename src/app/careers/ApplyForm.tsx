'use client';

import { useState, type FormEvent } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

type Props = { url: string; publishableKey: string; roles: string[] };

export default function ApplyForm({ url, publishableKey, roles }: Props) {
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    if (String(fields.get('website') || '').trim()) return;
    setSubmitting(true);
    setStatus('');
    try {
      const supabase = createClient(url, publishableKey, { auth: { persistSession: false } });
      const { error } = await supabase.from('job_applications').insert({
        applicant_name: String(fields.get('name') || '').trim(),
        email: String(fields.get('email') || '').trim(),
        phone: String(fields.get('phone') || '').trim() || null,
        role: String(fields.get('role') || '').trim(),
        experience: String(fields.get('experience') || '').trim(),
      });
      if (error) throw error;
      form.reset();
      setStatus('Thanks for applying. Your application has been received.');
    } catch {
      setStatus('We could not submit your application right now. Please call or text (603) 554-8571.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="soft-card mt-7 grid gap-4 bg-white p-6 md:grid-cols-2 md:p-8">
      <label className="grid gap-2 text-sm font-bold">Full name<input required maxLength={120} name="name" autoComplete="name" className="soft-inset rounded-xl px-4 py-3 font-normal" /></label>
      <label className="grid gap-2 text-sm font-bold">Email<input required maxLength={254} type="email" name="email" autoComplete="email" className="soft-inset rounded-xl px-4 py-3 font-normal" /></label>
      <label className="grid gap-2 text-sm font-bold">Phone (optional)<input maxLength={40} type="tel" name="phone" autoComplete="tel" className="soft-inset rounded-xl px-4 py-3 font-normal" /></label>
      <label className="grid gap-2 text-sm font-bold">Role you’re interested in<select required name="role" defaultValue="" className="soft-inset rounded-xl px-4 py-3 font-normal"><option value="" disabled>Choose a role</option>{roles.map((role) => <option key={role} value={role}>{role}</option>)}<option value="General application">General application</option></select></label>
      <label className="grid gap-2 text-sm font-bold md:col-span-2">A little about your experience<textarea required minLength={20} maxLength={3000} name="experience" rows={5} className="soft-inset rounded-xl px-4 py-3 font-normal" /></label>
      <label aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">Leave this field blank<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <div className="md:col-span-2"><button type="submit" disabled={submitting} className="soft-action min-h-12 px-6 py-3 text-sm font-black uppercase tracking-wide text-white disabled:opacity-50">{submitting ? 'Sending…' : 'Send application'}</button>{status && <p role="status" className="mt-4 text-sm font-semibold">{status}</p>}<p className="mt-3 text-xs leading-5 text-black/60">We’ll use your details to review your application and contact you about work at Chunki Chip. Email verification is not required. See our <Link className="underline" href="/privacy">Privacy Policy</Link>.</p></div>
    </form>
  );
}
