import Link from 'next/link';
import { ArrowRight, Archive } from 'lucide-react';

const flavors = [
  'Apple Cider Donut', 'Banana Cream Pie', 'Blueberry Cheesecake', 'Blueberry Pancake',
  'Brown Sugar Pop-Tart', 'Butterfinger', 'Cookie Dough Frosted', 'Cookie Monster',
  'Fluffernutter', 'Fruit Loops', 'M&M', 'Maple Cinnamon Roll', 'Oatmeal Chocolate Chip',
  'Oatmeal Raisin', 'Pecan Turtle Crunch', 'Pistachio Cream', 'Reese’s Pieces',
  'Red Velvet Oreo®', 'Snickers', 'Strawberry Cheesecake',
];

export default function FlavorArchivePage() {
  return (
    <main className="soft-page min-h-screen px-5 pb-16 pt-8 text-[#171315] md:px-10 md:pt-12">
      <div className="mx-auto max-w-7xl">
        <section className="soft-hero overflow-hidden bg-white p-7 md:p-12">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div><p className="text-xs font-black uppercase tracking-[.24em] text-[#eb2327]">The vault is open</p><h1 className="brand-heading mt-4 text-6xl leading-[.86] md:text-8xl">COOKIE FLAVOR ARCHIVE</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-black/70">A running record of Chunki Chip rotations, old favorites, and flavors that deserve their comeback moment.</p></div>
            <div className="soft-inset flex h-28 w-28 items-center justify-center rounded-full bg-[#ffccef] text-[#eb2327] md:h-36 md:w-36"><Archive size={48} strokeWidth={1.8}/></div>
          </div>
        </section>

        <section className="py-14"><div className="flex flex-col justify-between gap-4 border-b border-black/15 pb-5 md:flex-row md:items-end"><div><p className="text-xs font-black uppercase tracking-[.22em] text-[#eb2327]">Former weekly drops</p><h2 className="brand-heading mt-3 text-5xl leading-none md:text-6xl">THE FLAVOR FILES</h2></div><p className="text-sm font-black uppercase tracking-[.14em]">{flavors.length} archived flavors</p></div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{flavors.map((flavor, index) => <article key={flavor} className="soft-card group flex min-h-44 flex-col justify-between bg-white p-6"><span className="text-xs font-black uppercase tracking-[.18em] text-[#eb2327]">Archive No. {String(index + 1).padStart(2, '0')}</span><h3 className="brand-heading mt-6 text-4xl leading-[.92]">{flavor}</h3><span className="mt-6 border-t border-black/10 pt-3 text-xs font-bold uppercase tracking-[.14em] text-black/55">Retired favorite</span></article>)}</div>
        </section>

        <section className="soft-card grid gap-6 bg-white p-7 md:grid-cols-[1fr_auto] md:items-center md:p-10"><div><p className="text-xs font-black uppercase tracking-[.22em] text-[#eb2327]">Want one back?</p><h2 className="brand-heading mt-3 text-5xl leading-[.9]">KEEP AN EYE ON THE WEEKLY MENU.</h2><p className="mt-4 max-w-2xl text-sm leading-6 text-black/65">Archive favorites can always make another appearance. Check this week’s menu to see what is in the oven now.</p></div><Link href="/#single-cookies" className="soft-action inline-flex min-h-14 items-center justify-center gap-3 px-6 py-4 text-sm font-black uppercase tracking-wide text-white transition">See this week’s flavors <ArrowRight size={18}/></Link></section>
      </div>
    </main>
  );
}
