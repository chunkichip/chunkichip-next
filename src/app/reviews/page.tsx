
import ManagedText from '@/components/ManagedText';
import type { Metadata } from 'next';
import { ArrowUpRight, Star } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Reviews | Chunki Chip',
  description: 'See what customers are saying about Chunki Chip and leave a review after your visit.',
  alternates: { canonical: '/reviews' },
};

export default function ReviewsPage() {
  return <main className="soft-page min-h-screen px-5 py-14 text-[#171315] md:px-10 md:py-20"><div className="mx-auto max-w-5xl"><section className="soft-hero bg-white p-7 text-center md:p-12"><Star className="mx-auto text-[#eb2327]" size={34} fill="currentColor"/><p className="mt-4 text-xs font-black uppercase tracking-[.22em] text-[#eb2327]"><ManagedText id="a6d31c14be77265c603c4464" fallback={"Your cookie story"} /></p><h1 className="brand-heading mt-3 text-6xl leading-[.86] md:text-8xl"><ManagedText id="d7f16fede1efa14685a39249" fallback={"REVIEWS"} /></h1><p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-black/70"><ManagedText id="8c80b080d3861be17649bb0b" fallback={"Tried a flavor you loved? Your honest feedback helps neighbors find us and helps us keep making the good stuff."} /></p><a href="https://www.google.com/search?q=Chunki+Chip+Milford+NH+reviews" target="_blank" rel="noreferrer" className="soft-action mt-7 inline-flex min-h-12 items-center gap-2 px-6 py-3 text-sm font-black uppercase tracking-wide text-white"><ManagedText id="dde969685fa87d1384f68599" fallback={"Read or leave a Google review"} /><ArrowUpRight size={17}/></a></section><section className="soft-card mt-8 bg-white p-7 md:p-10"><h2 className="brand-heading text-4xl"><ManagedText id="f94082aa9c01d09bc0b626a4" fallback={"THANKS FOR SUPPORTING LOCAL"} /></h2><p className="mt-4 max-w-3xl text-sm leading-7 text-black/70"><ManagedText id="2c05207ef2b414c86de555a9" fallback={"We’re keeping customer reviews on Google so you can see them in their original context. Use the link above to read the latest feedback or leave your own."} /></p></section></div></main>;
}

