
import ManagedText from '@/components/ManagedText';
import type { Metadata } from 'next';
import { ArrowUpRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Press | Chunki Chip',
  description: 'Press information and media inquiries for Chunki Chip, a cookie shop in Milford, New Hampshire.',
  alternates: { canonical: '/press' },
};

export default function PressPage() {
  return <main className="soft-page min-h-screen px-5 py-14 text-[#171315] md:px-10 md:py-20"><div className="mx-auto max-w-5xl"><section className="soft-hero bg-white p-7 md:p-12"><p className="text-xs font-black uppercase tracking-[.22em] text-[#eb2327]"><ManagedText id="d392b63957f415f18bbef241" fallback={"Media & stories"} /></p><h1 className="brand-heading mt-4 text-6xl leading-[.86] md:text-8xl"><ManagedText id="16b8b91967fe06fb9d66add0" fallback={"PRESS"} /></h1><p className="mt-6 max-w-2xl text-lg leading-8 text-black/70"><ManagedText id="e1b8a2afec67bebba5aef44c" fallback={"Chunki Chip is a New Hampshire cookie shop baking thick, stuffed cookies and weekly flavor drops in Milford."} /></p></section><section className="soft-card mt-8 bg-white p-7 md:p-10"><h2 className="brand-heading text-4xl"><ManagedText id="4830d5a3124dae34cd6b793f" fallback={"MEDIA INQUIRIES"} /></h2><p className="mt-4 max-w-3xl text-sm leading-7 text-black/70"><ManagedText id="54c138337b192e75652a23d1" fallback={"For interviews, photography requests, or press questions, call the shop. Please include your outlet, deadline, and what you’re working on."} /></p><a href="tel:+16035548571" className="soft-action mt-6 inline-flex min-h-12 items-center gap-2 px-6 py-3 text-sm font-black uppercase tracking-wide text-white"><ManagedText id="275fba957fa88ac22c5f0624" fallback={"Call (603) 554-8571"} /><ArrowUpRight size={17}/></a></section></div></main>;
}

