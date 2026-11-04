
import ManagedText from '@/components/ManagedText';
import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import ApplyForm from './ApplyForm';

export const metadata: Metadata = {
  title: 'Careers | Chunki Chip',
  description: 'Explore work opportunities at Chunki Chip in Milford, New Hampshire, and send an application.',
  alternates: { canonical: '/careers' },
};

export const dynamic = 'force-dynamic';

type JobOpening = {
  id: string;
  title: string;
  location: string;
  employment_type: string | null;
  description: string;
};

async function getOpenings(): Promise<JobOpening[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return [];

  try {
    const supabase = createClient(url, publishableKey, { auth: { persistSession: false } });
    const { data, error } = await supabase
      .from('job_openings')
      .select('id, title, location, employment_type, description')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export default async function CareersPage() {
  const openings = await getOpenings();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  return <main className="soft-page min-h-screen px-5 py-14 text-[#171315] md:px-10 md:py-20"><div className="mx-auto max-w-5xl">
    <section className="soft-hero bg-white p-7 md:p-12"><p className="text-xs font-black uppercase tracking-[.22em] text-[#eb2327]"><ManagedText id="2271a46b493fb1aab0756dca" fallback={"Come bake with us"} /></p><h1 className="brand-heading mt-4 text-6xl leading-[.86] md:text-8xl"><ManagedText id="833d234c3c283b0eb216140d" fallback={"CAREERS"} /></h1><p className="mt-6 max-w-2xl text-lg leading-8 text-black/70"><ManagedText id="030f9a9a91f7a1dcc0e0b6ab" fallback={"We’re growing a cookie shop with big energy. Explore current openings or send a general application and tell us what kind of role you’re looking for."} /></p></section>
    <section className="mt-10"><p className="text-xs font-black uppercase tracking-[.22em] text-[#eb2327]"><ManagedText id="3c412b1523ef80c79a1264cb" fallback={"Open positions"} /></p>{openings.length ? <div className="mt-4 grid gap-4 md:grid-cols-2">{openings.map((opening) => <article key={opening.id} className="soft-card bg-white p-6 md:p-8"><h2 className="brand-heading text-3xl md:text-4xl">{opening.title}</h2><p className="mt-2 text-xs font-black uppercase tracking-[.12em] text-black/55">{opening.location}{opening.employment_type ? ` · ${opening.employment_type}` : ''}</p><p className="mt-4 whitespace-pre-line text-sm leading-7 text-black/70">{opening.description}</p><a href="#application" className="soft-action mt-6 inline-flex min-h-11 items-center px-5 py-3 text-xs font-black uppercase tracking-wide text-white"><ManagedText id="b971916e647ca027bcfc8c32" fallback={"Apply for this role"} /></a></article>)}</div> : <div className="soft-card mt-4 bg-white p-6 md:p-8"><h2 className="brand-heading text-3xl md:text-4xl"><ManagedText id="5cf73ecde76ba5b5c2cc1241" fallback={"No specific openings posted right now"} /></h2><p className="mt-3 max-w-3xl text-sm leading-6 text-black/70"><ManagedText id="9bf09731ed3a9d169098d6f0" fallback={"We welcome general applications and will reach out if a fit opens up. New positions will appear here when posted."} /></p></div>}</section>
    <section id="application" className="mt-10"><p className="text-xs font-black uppercase tracking-[.22em] text-[#eb2327]"><ManagedText id="9a7ecb4f50c6b2a56869eeeb" fallback={"Apply"} /></p><h2 className="brand-heading mt-3 text-4xl md:text-5xl"><ManagedText id="3b4c8fa5ffed08349f8c2c4e" fallback={"SEND US YOUR INFO"} /></h2>{url && publishableKey ? <ApplyForm roles={openings.map((opening) => opening.title)} url={url} publishableKey={publishableKey} /> : <p className="soft-card mt-5 bg-white p-6"><ManagedText id="3cf8dfa3de5d8c0fadb1d54a" fallback={"Applications are temporarily unavailable. Please call (603) 554-8571."} /></p>}</section>
  </div></main>;
}
