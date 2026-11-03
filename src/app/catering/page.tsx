import Link from 'next/link';
import { ArrowRight, Phone } from 'lucide-react';

const details = [
  'Choose from our current weekly cookie lineup',
  'Wrapped or unwrapped options for easy serving',
  'Boxes sized for office treats, parties, and big celebrations',
];

export default function CateringPage() {
  return (
    <main className="soft-page min-h-screen px-5 pb-16 pt-8 text-[#171315] md:px-10 md:pt-12">
      <div className="mx-auto max-w-7xl">
        <section className="soft-hero overflow-hidden bg-white p-7 md:p-12">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[.24em] text-[#eb2327]">Make the table better</p>
              <h1 className="brand-heading mt-4 max-w-3xl text-6xl leading-[.86] md:text-8xl">CATERING, BUT MAKE IT CHUNKI.</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-black/70">Big cookies for the group chat, the office, birthdays, showers, team wins, and every reason to bring dessert.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="tel:+16035548571" className="soft-action inline-flex min-h-14 items-center justify-center gap-3 px-6 py-4 text-sm font-black uppercase tracking-wide text-white transition"><Phone size={18}/> Call or text to plan it</a>
                <Link href="/#boxes" className="soft-card soft-link-card inline-flex min-h-14 items-center justify-center gap-3 bg-white px-6 py-4 text-sm font-black uppercase tracking-wide transition">Order cookie boxes <ArrowRight size={18}/></Link>
              </div>
            </div>
            <div className="soft-inset flex min-h-[300px] flex-col justify-between rounded-[2rem] bg-[#ffccef] p-7 md:p-9">
              <p className="text-xs font-black uppercase tracking-[.22em] text-[#eb2327]">Catering starts here</p>
              <div><p className="brand-heading text-5xl leading-[.88]">THE COOKIE<br/>CREW HAS YOU.</p><p className="mt-5 max-w-sm text-sm font-semibold leading-6 text-black/70">Tell us your date, headcount, and cookie vision. We’ll help you build the right order.</p></div>
              <span className="mt-7 inline-flex w-fit bg-[#eb2327] px-4 py-2 text-xs font-black uppercase tracking-[.16em] text-white">Milford, NH</span>
            </div>
          </div>
        </section>

        <section className="py-14">
          <div className="flex flex-col justify-between gap-4 border-b border-black/15 pb-5 md:flex-row md:items-end"><div><p className="text-xs font-black uppercase tracking-[.22em] text-[#eb2327]">For every kind of crowd</p><h2 className="brand-heading mt-3 text-5xl leading-none md:text-6xl">CATERING OPTIONS</h2></div><p className="max-w-md text-sm leading-6 text-black/65">Fresh baked, packed with care, and ready to disappear.</p></div>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <article className="soft-card bg-white p-7"><p className="text-xs font-black uppercase tracking-[.18em] text-[#eb2327]">Ready to grab</p><h3 className="brand-heading mt-4 text-5xl leading-none">INDIVIDUALLY WRAPPED</h3><p className="mt-5 text-lg font-black">$4 per cookie</p><p className="mt-3 text-sm leading-6 text-black/65">Perfect for meetings, thank-yous, favor tables, and moments where every person gets their own Chunki.</p></article>
            <article className="soft-card bg-white p-7"><p className="text-xs font-black uppercase tracking-[.18em] text-[#eb2327]">Put them out and watch them go</p><h3 className="brand-heading mt-4 text-5xl leading-none">UNWRAPPED COOKIE TRAYS</h3><p className="mt-5 text-lg font-black">$3.50 per cookie</p><p className="mt-3 text-sm leading-6 text-black/65">Built for dessert spreads, parties, and cookie tables with zero leftovers expected.</p></article>
          </div>
        </section>

        <section className="soft-card grid gap-8 bg-white p-7 md:grid-cols-[.9fr_1.1fr] md:p-10">
          <div><p className="text-xs font-black uppercase tracking-[.22em] text-[#eb2327]">How it works</p><h2 className="brand-heading mt-3 text-5xl leading-[.9]">LET’S BUILD YOUR ORDER.</h2></div>
          <div className="grid gap-4 sm:grid-cols-3">{details.map((detail, index) => <div key={detail} className="soft-inset rounded-2xl p-5"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eb2327] text-xs font-black text-white">0{index + 1}</span><p className="mt-5 text-sm font-bold leading-6">{detail}</p></div>)}</div>
        </section>

        <section className="mt-14 text-center"><p className="text-xs font-black uppercase tracking-[.22em] text-[#eb2327]">Got an event coming up?</p><h2 className="brand-heading mt-3 text-5xl leading-none md:text-7xl">LET’S TALK COOKIES.</h2><a href="tel:+16035548571" className="soft-action mt-7 inline-flex min-h-14 items-center justify-center gap-3 px-8 py-4 text-sm font-black uppercase tracking-wide text-white transition"><Phone size={18}/> (603) 554-8571</a></section>
      </div>
    </main>
  );
}
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Catering | Chunki Chip',
  description: 'Ask Chunki Chip about cookie catering, dessert tables, and larger orders in Milford, New Hampshire.',
  alternates: { canonical: '/catering' },
};

