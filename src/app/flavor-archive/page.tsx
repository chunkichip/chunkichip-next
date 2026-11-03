import Link from 'next/link';
import { ArrowRight, Archive } from 'lucide-react';
import photographedFlavors from './flavors.json';
import { ArchiveVotingProvider, ArchiveVotePanel, ComebackButton } from './Voting';
import { ArchiveFavoritesProvider, FavoriteButton, FavoriteEntry, FavoritesToolbar, OtherFavoritesSection } from './Favorites';

const otherFlavors = [
  'Blueberry Cheesecake', 'Brown Sugar Pop-Tart', 'Oatmeal Chocolate Chip', 'Snickers',
];

export default function FlavorArchivePage() {
  return (
    <ArchiveVotingProvider names={[...photographedFlavors.map((flavor) => flavor.name), ...otherFlavors]}>
    <ArchiveFavoritesProvider names={[...photographedFlavors.map((flavor) => flavor.name), ...otherFlavors]}>
    <main className="soft-page min-h-screen px-5 pb-16 pt-8 text-[#171315] md:px-10 md:pt-12">
      <div className="mx-auto max-w-7xl">
        <section className="soft-hero overflow-hidden bg-white p-7 md:p-12">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div><p className="text-xs font-black uppercase tracking-[.24em] text-[#eb2327]">The vault is open</p><h1 className="brand-heading mt-4 text-6xl leading-[.86] md:text-8xl">COOKIE FLAVOR ARCHIVE</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-black/70">A running record of Chunki Chip rotations, old favorites, and flavors that deserve their comeback moment.</p></div>
            <div className="soft-inset flex h-28 w-28 items-center justify-center rounded-full bg-[#ffccef] text-[#eb2327] md:h-36 md:w-36"><Archive size={48} strokeWidth={1.8}/></div>
          </div>
        </section>

        <section className="py-14"><div className="flex flex-col justify-between gap-4 border-b border-black/15 pb-5 md:flex-row md:items-end"><div><p className="text-xs font-black uppercase tracking-[.22em] text-[#eb2327]">Former weekly drops</p><h2 className="brand-heading mt-3 text-5xl leading-none md:text-6xl">THE FLAVOR FILES</h2></div><p className="text-sm font-black uppercase tracking-[.14em]">{photographedFlavors.length + otherFlavors.length} archived flavors</p></div>
          <FavoritesToolbar />
          <ArchiveVotePanel />
          <div className="mt-8 grid grid-cols-1 gap-7 md:grid-cols-3">
            {photographedFlavors.map((flavor) => (
              <FavoriteEntry key={flavor.name} name={flavor.name} className="soft-card flex flex-col overflow-hidden bg-white p-4">
                <a href={flavor.image} target="_blank" rel="noopener noreferrer" aria-label={`View ${flavor.name} photo`} className="soft-inset block overflow-hidden rounded-2xl bg-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#eb2327]">
                  <img src={flavor.image} alt={flavor.name} loading="lazy" decoding="async" width={900} height={900} className={`aspect-square h-auto w-full object-contain ${'isolated' in flavor && flavor.isolated ? 'p-6 drop-shadow-[0_12px_12px_rgba(40,20,20,0.12)]' : ''}`} />
                </a>
                <div className="flex flex-1 flex-col px-3 pb-3 pt-6">
                  <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#eb2327]">From the flavor archive</p>
                  <h3 className="brand-heading mt-3 text-3xl leading-tight lg:text-4xl">{flavor.name}</h3>
                  <p className="mt-4 flex-1 text-sm leading-7 text-black/65">{flavor.description}</p>
                  <FavoriteButton name={flavor.name} />
                  <ComebackButton name={flavor.name} />
                  <span className="mt-6 border-t border-black/10 pt-3 text-xs font-bold uppercase tracking-[.12em] text-black/50">Past flavor</span>
                </div>
              </FavoriteEntry>
            ))}
          </div>
          <OtherFavoritesSection names={otherFlavors}>
          <h3 className="brand-heading mt-14 text-4xl">MORE FROM THE ARCHIVE</h3>
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">{otherFlavors.map((flavor) => <FavoriteEntry key={flavor} name={flavor} className="soft-card bg-white p-6"><h4 className="brand-heading text-3xl leading-tight">{flavor}</h4><p className="mt-3 text-xs font-bold uppercase tracking-[.12em] text-black/50">Past flavor</p><FavoriteButton name={flavor} /><ComebackButton name={flavor} /></FavoriteEntry>)}</div>
          </OtherFavoritesSection>
        </section>

        <section className="soft-card grid gap-6 bg-white p-7 md:grid-cols-[1fr_auto] md:items-center md:p-10"><div><p className="text-xs font-black uppercase tracking-[.22em] text-[#eb2327]">Want one back?</p><h2 className="brand-heading mt-3 text-5xl leading-[.9]">KEEP AN EYE ON THE WEEKLY MENU.</h2><p className="mt-4 max-w-2xl text-sm leading-6 text-black/65">Archive favorites can always make another appearance. Check this week’s menu to see what is in the oven now.</p></div><Link href="/#single-cookies" className="soft-action inline-flex min-h-14 items-center justify-center gap-3 px-6 py-4 text-sm font-black uppercase tracking-wide text-white transition">See this week’s flavors <ArrowRight size={18}/></Link></section>
      </div>
    </main>
    </ArchiveFavoritesProvider>
    </ArchiveVotingProvider>
  );
}
