
import ManagedText from '@/components/ManagedText';
import type { Metadata } from 'next';
import PressInquiry from './PressInquiry';

export const metadata: Metadata = {
  title: 'Press | Chunki Chip',
  description: 'Press information and media inquiries for Chunki Chip, a cookie shop in Milford, New Hampshire.',
  alternates: { canonical: '/press' },
};

export default function PressPage() {
  return <main className="soft-page min-h-screen px-5 py-14 text-[#171315] md:px-10 md:py-20"><div className="mx-auto max-w-5xl"><section className="soft-hero bg-white p-7 md:p-12"><p className="text-xs font-black uppercase tracking-[.22em] text-[#eb2327]"><ManagedText id="d392b63957f415f18bbef241" fallback={"Media & stories"} /></p><h1 className="brand-heading mt-4 text-6xl leading-[.86] md:text-8xl"><ManagedText id="16b8b91967fe06fb9d66add0" fallback={"PRESS"} /></h1><p className="mt-6 max-w-2xl text-lg leading-8 text-black/70"><ManagedText id="e1b8a2afec67bebba5aef44c" fallback={"Chunki Chip is a New Hampshire cookie shop baking thick, stuffed cookies and weekly flavor drops in Milford."} /></p></section><section className="soft-card mt-8 bg-white p-7 md:p-10"><h2 className="brand-heading text-4xl"><ManagedText id="4830d5a3124dae34cd6b793f" fallback={"MEDIA INQUIRIES"} /></h2><p className="mt-4 max-w-3xl text-base leading-7 text-black/70">For interviews, photography requests, or press questions, use the form below or email <a className="font-bold underline break-all" href="mailto:press@chunkichip.com">press@chunkichip.com</a>.</p><PressInquiry /></section></div></main>;
}

