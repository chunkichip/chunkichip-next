
import ManagedText from '@/components/ManagedText';
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
              <p className="text-xs font-black uppercase tracking-[.24em] text-[#eb2327]"><ManagedText id="ecd49feba92730f8c5fca48e" fallback={"Make the table better"} /></p>
              <h1 className="brand-heading mt-4 max-w-3xl text-6xl leading-[.86] md:text-8xl"><ManagedText id="cb16f732ea6a89dc3a253290" fallback={"CATERING, BUT MAKE IT CHUNKI."} /></h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-black/70"><ManagedText id="03d6839ab83868bd611d8da4" fallback={"Big cookies for the group chat, the office, birthdays, showers, team wins, and every reason to bring dessert."} /></p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="tel:+16035548571" className="soft-action inline-flex min-h-14 items-center justify-center gap-3 px-6 py-4 text-sm font-black uppercase tracking-wide text-white transition"><Phone size={18}/><ManagedText id="20c7ad008cf1adf197501c76" fallback={"Call or text to plan it"} /></a>
                <Link href="/#boxes" className="soft-card soft-link-card inline-flex min-h-14 items-center justify-center gap-3 bg-white px-6 py-4 text-sm font-black uppercase tracking-wide transition"><ManagedText id="ac8ac2329e34aff73adc7411" fallback={"Order cookie boxes"} /><ArrowRight size={18}/></Link>
              </div>
            </div>
            <div className="soft-inset flex min-h-[300px] flex-col justify-between rounded-[2rem] bg-[#ffccef] p-7 md:p-9">
              <p className="text-xs font-black uppercase tracking-[.22em] text-[#eb2327]"><ManagedText id="c113c9d031a949eb5710ad11" fallback={"Catering starts here"} /></p>
              <div><p className="brand-heading text-5xl leading-[.88]"><ManagedText id="23a118239d5e602911ae350a" fallback={"THE COOKIE"} /><br/><ManagedText id="889c0a7b86abf708abc6f474" fallback={"CREW HAS YOU."} /></p><p className="mt-5 max-w-sm text-sm font-semibold leading-6 text-black/70"><ManagedText id="e9bcc804ff686ffdc9c505c9" fallback={"Tell us your date, headcount, and cookie vision. We’ll help you build the right order."} /></p></div>
              <span className="mt-7 inline-flex w-fit bg-[#eb2327] px-4 py-2 text-xs font-black uppercase tracking-[.16em] text-white"><ManagedText id="2a42067dd7ed3f204a12d5e7" fallback={"Milford, NH"} /></span>
            </div>
          </div>
        </section>

        <section className="py-14">
          <div className="flex flex-col justify-between gap-4 border-b border-black/15 pb-5 md:flex-row md:items-end"><div><p className="text-xs font-black uppercase tracking-[.22em] text-[#eb2327]"><ManagedText id="4c239eff6bc1b80aecbdd1d2" fallback={"For every kind of crowd"} /></p><h2 className="brand-heading mt-3 text-5xl leading-none md:text-6xl"><ManagedText id="66ef580b68a433eb934b82a9" fallback={"CATERING OPTIONS"} /></h2></div><p className="max-w-md text-sm leading-6 text-black/65"><ManagedText id="51d490d4e08596ba0b66085c" fallback={"Fresh baked, packed with care, and ready to disappear."} /></p></div>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <article className="soft-card bg-white p-7"><p className="text-xs font-black uppercase tracking-[.18em] text-[#eb2327]"><ManagedText id="4817a86a247b6b8129340135" fallback={"Ready to grab"} /></p><h3 className="brand-heading mt-4 text-5xl leading-none"><ManagedText id="d6d98af1f7046e0d658c851d" fallback={"INDIVIDUALLY WRAPPED"} /></h3><p className="mt-5 text-lg font-black"><ManagedText id="029b6b48b8f4f0e69b4445ac" fallback={"$4 per cookie"} /></p><p className="mt-3 text-sm leading-6 text-black/65"><ManagedText id="302dcf92d824f2d7c04767ec" fallback={"Perfect for meetings, thank-yous, favor tables, and moments where every person gets their own Chunki."} /></p></article>
            <article className="soft-card bg-white p-7"><p className="text-xs font-black uppercase tracking-[.18em] text-[#eb2327]"><ManagedText id="86c85ee690c38f5f3c0fcf16" fallback={"Put them out and watch them go"} /></p><h3 className="brand-heading mt-4 text-5xl leading-none"><ManagedText id="a3d7803ae5dd75a3aae461c5" fallback={"UNWRAPPED COOKIE TRAYS"} /></h3><p className="mt-5 text-lg font-black"><ManagedText id="cd2a586c9d901400d72a2408" fallback={"$3.50 per cookie"} /></p><p className="mt-3 text-sm leading-6 text-black/65"><ManagedText id="fa456a01d06ed33c798278d0" fallback={"Built for dessert spreads, parties, and cookie tables with zero leftovers expected."} /></p></article>
          </div>
        </section>

        <section className="soft-card grid gap-8 bg-white p-7 md:grid-cols-[.9fr_1.1fr] md:p-10">
          <div><p className="text-xs font-black uppercase tracking-[.22em] text-[#eb2327]"><ManagedText id="6e8018813aa03cbec36a7445" fallback={"How it works"} /></p><h2 className="brand-heading mt-3 text-5xl leading-[.9]"><ManagedText id="2f4d66042876217312153f4b" fallback={"LET’S BUILD YOUR ORDER."} /></h2></div>
          <div className="grid gap-4 sm:grid-cols-3">{details.map((detail, index) => <div key={detail} className="soft-inset rounded-2xl p-5"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eb2327] text-xs font-black text-white">0{index + 1}</span><p className="mt-5 text-sm font-bold leading-6">{detail}</p></div>)}</div>
        </section>

        <section className="mt-14 text-center"><p className="text-xs font-black uppercase tracking-[.22em] text-[#eb2327]"><ManagedText id="2435fc147a8da8fe13e92df4" fallback={"Got an event coming up?"} /></p><h2 className="brand-heading mt-3 text-5xl leading-none md:text-7xl"><ManagedText id="e158da11a0001c60061d0f13" fallback={"LET’S TALK COOKIES."} /></h2><a href="tel:+16035548571" className="soft-action mt-7 inline-flex min-h-14 items-center justify-center gap-3 px-8 py-4 text-sm font-black uppercase tracking-wide text-white transition"><Phone size={18}/> (603) 554-8571</a></section>
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

