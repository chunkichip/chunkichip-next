'use client';

import ManagedText from '@/components/ManagedText';
import EmailSignup from '@/components/EmailSignup';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUpRight, ShoppingBag } from 'lucide-react';
import { getWeeklyFlavors, isInPersonCookieBox, isInternalPackaging, isShippingOnlyProduct } from '@/lib/catalog';

type ModifierSet = { modifiers: { id: string; name: string; priceAmount: number; price: string }[] };
type Product = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  variationId: string | null;
  priceAmount: number;
  price: string;
  isBox: boolean;
  boxSize: string | null;
  modifierSets?: ModifierSet[];
};

const api = (path: string) => `${process.env.NEXT_PUBLIC_API_URL || ''}${path}`;

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(api('/api/products'))
      .then(async (response) => {
        if (!response.ok) throw new Error('Menu is temporarily unavailable. Please try again shortly.');
        return response.json();
      })
      .then((data: Product[]) => setProducts(Array.isArray(data) ? data : []))
      .catch((loadError: Error) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, []);

  const inPersonBoxes = products
    .filter(isInPersonCookieBox)
    .sort((a, b) => Number(a.name.match(/^\d+/)?.[0] || 0) - Number(b.name.match(/^\d+/)?.[0] || 0));
  const shippingBoxes = products.filter((product) => isShippingOnlyProduct(product) && !isInternalPackaging(product));
  const cookies = getWeeklyFlavors(products).map((flavor) => ({
    ...flavor,
    price: inPersonBoxes[0]?.price || flavor.price || '',
  }));

  return (
    <main className="soft-page min-h-screen overflow-hidden text-[#171315]">
      <section className="relative px-5 py-5 md:px-12 md:py-8">
        <div className="soft-hero mx-auto max-w-[1400px] px-5 py-8 md:px-10 md:py-12">
          <div className="flex items-center justify-between pb-4 text-[11px] font-black uppercase tracking-[.2em] text-black/70">
            <a href="/" aria-label="Chunki Chip home"><ManagedText id="d89e44936bfa7dcce8590698" fallback={"CHUNKI CHIP®"} /></a>
            <span><ManagedText id="4da116b4eb144b507795662e" fallback={"Milford, NH · Fresh baked daily"} /></span>
            <a href="#menu" className="flex items-center gap-2"><ManagedText id="dd511e6b4934ba45664b4773" fallback={"Order online"} /><ShoppingBag size={16}/></a>
          </div>
          <div className="grid items-center gap-8 pt-10 md:grid-cols-[1.2fr_.8fr] md:pt-14">
            <div>
              <p className="mb-5 inline-block rounded-full bg-[#ffccef] px-4 py-2 text-xs font-black uppercase tracking-[.16em] text-[#eb2327]"><ManagedText id="e9e585e32a011519ea561caf" fallback={"Fresh baked in Milford"} /></p>
              <h1 className="brand-heading text-[clamp(3.7rem,8vw,7.5rem)] leading-[.84] tracking-[-.035em] text-[#171315]"><ManagedText id="48020e09c7eea6664cd12bc5" fallback={"FRESH BAKED."} /><br/><ManagedText id="770fbe5bed1ee98ef237e5bd" fallback={"BIG ENERGY."} /></h1>
            </div>
            <div className="md:pb-2">
              <p className="max-w-md text-xl font-semibold leading-snug md:text-2xl"><ManagedText id="6487ad8af01f5a29a2fe9ce3" fallback={"Ridiculously thick cookies. Loud flavors. Made in New Hampshire and shipped nationwide."} /></p>
              <a href="#menu" className="soft-action mt-8 inline-flex items-center gap-3 px-6 py-4 text-sm font-black uppercase tracking-wide text-white transition"><ManagedText id="dca18c02a92fa798fbe0a886" fallback={"Shop the menu"} /><ArrowDown size={18}/></a>
            </div>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-2 pt-4 text-[10px] font-black uppercase tracking-[.18em] text-black/55">
            <span><ManagedText id="31f8e229dc29c1a2dac2c066" fallback={"01 / 183 Elm Street, Milford"} /></span><span><ManagedText id="343fdb173fbfbe42a8e02a56" fallback={"02 / Somerset Plaza coming soon"} /></span><span><ManagedText id="9079c7e5f07f8004610e1048" fallback={"Cookie boxes · Chiptinis™ · Catering"} /></span>
          </div>
        </div>
      </section>

      <section id="menu" className="mx-auto max-w-[1400px] px-5 py-14 md:px-12 md:py-20">
        <div className="flex flex-col justify-between gap-5 pb-5 md:flex-row md:items-end">
          <div><p className="text-xs font-black uppercase tracking-[.22em] text-[#eb2327]"><ManagedText id="a0fbc3c25208f137cfb3045a" fallback={"The current lineup"} /></p><h2 className="brand-heading mt-3 text-5xl md:text-6xl"><ManagedText id="c63a62841b4303eed83e28b5" fallback={"PICK YOUR"} /><br className="md:hidden"/><ManagedText id="919357b3769a16ef9c7a10a0" fallback={"FIX."} /></h2></div>
          <p className="max-w-sm text-sm font-medium leading-relaxed"><ManagedText id="8bc20eb646cff76bd6a901e2" fallback={"Pickup boxes and nationwide shipping boxes are listed separately. Cookie names, photos, and prices sync from Square."} /></p>
        </div>

        {error && <div role="alert" className="mt-8 border-2 border-[#eb2327] bg-white p-5 font-semibold">{error}<p className="mt-1 text-sm font-normal"><ManagedText id="8024259a33ae162674f8cede" fallback={"Please call the shop or try again later."} /></p></div>}
        {loading && <p className="py-14 text-center font-black uppercase tracking-widest"><ManagedText id="5dda26ff5d79e8c670546ba2" fallback={"Loading today’s cookies…"} /></p>}

        {!loading && !error && <>
          {inPersonBoxes.length > 0 && (
            <div id="boxes" className="mt-10 scroll-mt-24">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div><p className="text-xs font-black uppercase tracking-[.2em] text-[#eb2327]"><ManagedText id="74554fec77f3b8b9c8ddf072" fallback={"In-store pickup or curbside"} /></p><h3 className="brand-heading mt-2 text-4xl md:text-5xl"><ManagedText id="b5d5876195733b7e19ed5223" fallback={"BUILD A BOX"} /></h3></div>
                <span className="text-xs font-black uppercase tracking-widest"><ManagedText id="624e7ab4cfb853dcd9faa8c7" fallback={"Numbered cookie boxes"} /></span>
              </div>
              <div className="grid gap-5 lg:grid-cols-3">
                {inPersonBoxes.map((product) => (
                  <Link key={product.id} href={`/product/${encodeURIComponent(product.id)}`} className="group soft-card soft-link-card flex min-h-[360px] flex-col bg-white text-left transition focus-visible:outline-[#eb2327]">
                    <div className="soft-inset flex min-h-[225px] items-center justify-center p-4">
                      {product.boxSize ? <img src={`/boxes/${product.boxSize}-box.png`} alt={`Open ${product.name}`} className="h-52 w-full object-contain transition duration-300 group-hover:scale-[1.03]"/> : <span className="text-7xl">🍪</span>}
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-5">
                      <div><span className="text-xs font-black uppercase tracking-[.18em] text-[#eb2327]">{product.boxSize}<ManagedText id="0a60ff7eb1cccc7aaeb83a7c" fallback={"cookies"} /></span><h4 className="brand-heading mt-3 text-4xl">{product.name}</h4></div>
                      <span className="mt-5 flex items-center justify-between border-t border-black/10 pt-3 text-sm font-bold"><span>{product.price}</span><span className="flex items-center gap-1 uppercase"><ManagedText id="ec173a4485b4ef70ed930e37" fallback={"Build"} /><ArrowUpRight size={16}/></span></span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {shippingBoxes.length > 0 && (
            <div id="shipping-boxes" className="mt-14 scroll-mt-24">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div><p className="text-xs font-black uppercase tracking-[.2em] text-[#eb2327]"><ManagedText id="4ccde6a4147831bbb410ad27" fallback={"Nationwide shipping only"} /></p><h3 className="brand-heading mt-2 text-4xl md:text-5xl"><ManagedText id="10e93d28138192bb0d1e62ff" fallback={"SHIP A BOX"} /></h3></div>
                <span className="text-xs font-black uppercase tracking-widest"><ManagedText id="98ffde69a7bf4bd617bf1637" fallback={"Packed for the trip"} /></span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {shippingBoxes.map((product, index) => {
                  const hasBuilder = product.isBox && Boolean(product.modifierSets?.some((set) => set.modifiers.length));
                  return (
                    <Link key={product.id} href={`/product/${encodeURIComponent(product.id)}`} className="group soft-card soft-link-card grid grid-cols-[38%_1fr] bg-white transition">
                      <div className={`soft-inset flex min-h-[175px] items-center justify-center ${index % 3 === 1 ? 'bg-[#fff7fb]' : index % 3 === 2 ? 'bg-[#fff7fb]' : 'bg-[#f8fafc]'}`}>
                        {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="h-36 w-full object-contain p-2"/> : <span className="text-6xl">🍪</span>}
                      </div>
                      <div className="flex min-w-0 flex-col justify-between p-4">
                        <div><span className="text-[10px] font-black uppercase tracking-[.15em] text-[#eb2327]"><ManagedText id="29a24597a2f7573af0e50fdf" fallback={"Shipping only"} /></span><h4 className="brand-heading mt-2 text-2xl leading-tight">{product.name}</h4><p className="mt-2 line-clamp-3 text-xs leading-relaxed text-black/70">{product.description}</p></div>
                        <span className="mt-4 flex items-center justify-between border-t border-black pt-3 text-sm font-bold"><span>{product.price}</span><span className="flex items-center gap-1 uppercase">{hasBuilder ? 'Build' : 'View'} <ArrowUpRight size={16}/></span></span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div id="single-cookies" className="mt-14 scroll-mt-24">
            <div className="mb-5 flex flex-col gap-2 pb-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[.2em] text-[#eb2327]"><ManagedText id="253cea0d7154655d82eba1f0" fallback={"Fresh from the oven"} /></p><h3 className="brand-heading text-5xl md:text-7xl"><ManagedText id="92c27f51df20da216165f7fb" fallback={"WEEKLY FLAVORS"} /></h3></div><span className="text-xs font-black uppercase tracking-widest"><ManagedText id="caf7883b50661113262282ae" fallback={"Tap a flavor to order"} /></span></div>
            {cookies.length === 0 ? <p className="border-2 border-dashed border-black p-8 text-center"><ManagedText id="9108f920b83978d739b79707" fallback={"This week’s flavors are being refreshed. Check back soon."} /></p> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cookies.map((product, index) => <Link href={`/product/${encodeURIComponent(product.id)}`} key={product.id} className="group soft-card soft-link-card grid bg-white transition focus-visible:outline-[#eb2327]"><div className={`soft-inset flex min-h-[250px] items-center justify-center ${index % 3 === 1 ? 'bg-[#fff7fb]' : index % 3 === 2 ? 'bg-[#fff7fb]' : 'bg-[#f8fafc]'}`}>{product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="h-56 w-full object-contain p-5 transition duration-300 group-hover:scale-105"/> : <span className="text-7xl">🍪</span>}</div><div className="flex flex-col justify-between p-5"><div><h4 className="brand-heading text-3xl leading-tight md:text-4xl">{product.name}</h4><p className="mt-3 text-sm leading-6 text-black/75">{product.description || 'A fresh-baked Chunki Chip favorite.'}</p></div><span className="mt-5 flex items-center justify-between border-t border-black pt-3 text-sm font-black uppercase"><span>{product.price}</span><span className="flex items-center gap-2"><ManagedText id="f66984fcab7692a68b971de6" fallback={"Order now"} /><ArrowUpRight size={17}/></span></span></div></Link>)}</div>}
            <a href="/flavor-archive" className="mt-6 inline-block text-sm font-bold underline underline-offset-4">Explore past flavors and vote for a comeback →</a>
          </div>
        </>}

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          <a href="https://www.doordash.com/store/chunki-chip-milford-39514093/107306346/" className="soft-card soft-link-card bg-white p-6 text-[#171315]"><span className="text-xs font-black uppercase tracking-widest"><ManagedText id="cb836b4142385ea2a4e9b37f" fallback={"Local delivery"} /></span><h3 className="brand-heading mt-4 text-4xl"><ManagedText id="38988d673f3eb19aae2bf64c" fallback={"DOORDASH"} /></h3><span className="mt-4 inline-block text-sm font-bold underline underline-offset-4"><ManagedText id="dc7fd8a7fa95bc28664ecfcd" fallback={"Order nearby ↗"} /></span></a>
          <a href="#shipping-boxes" className="soft-card soft-link-card bg-white p-6"><span className="text-xs font-black uppercase tracking-widest"><ManagedText id="50748828737ef84ee2d13eda" fallback={"Send Chunki nationwide"} /></span><h3 className="brand-heading mt-4 text-4xl"><ManagedText id="911ab123f14b11910c02bb4c" fallback={"SHIPPING BOXES"} /></h3><span className="mt-4 inline-block text-sm font-bold underline underline-offset-4"><ManagedText id="af47eec9789f205077fb8c8c" fallback={"Choose a box ↗"} /></span></a>
          <a href="#locations" className="soft-card soft-link-card bg-white p-6"><span className="text-xs font-black uppercase tracking-widest"><ManagedText id="c1be65c52ec0d8243d9be214" fallback={"Find a cookie"} /></span><h3 className="brand-heading mt-4 text-4xl"><ManagedText id="4f800e08a7920bb64f820b8c" fallback={"COME BY"} /></h3><span className="mt-4 inline-block text-sm font-bold underline underline-offset-4"><ManagedText id="a20b47ec085868092ff866a1" fallback={"Hours & locations ↗"} /></span></a>
        </div>
      </section>

      <section id="locations" className="px-5 py-12 md:px-12"><div className="soft-hero mx-auto grid max-w-[1400px] gap-8 bg-white p-7 text-[#171315] md:grid-cols-2 md:p-10"><div><p className="text-xs font-black uppercase tracking-[.22em] text-[#eb2327]"><ManagedText id="35414ee8b9b4e84f018a5471" fallback={"Find us"} /></p><h2 className="brand-heading mt-3 text-5xl md:text-6xl"><ManagedText id="b0c63753920c290b10df9331" fallback={"MILFORD, NEW HAMPSHIRE"} /></h2><p className="mt-4 max-w-lg text-sm leading-6 text-black/65"><ManagedText id="36184cf30651869f99fc68ec" fallback={"Fresh baked in Milford. Find current hours and directions on Google, or order local delivery through DoorDash."} /></p><address className="mt-4 text-sm not-italic leading-7">Chunki Chip Cookies<br/>183 Elm St, Unit 8<br/>Milford, NH 03055<br/><a href="tel:+16035548571" className="font-bold underline">(603) 554-8571</a></address><a className="mt-5 inline-block text-sm font-bold underline underline-offset-4" href="https://www.google.com/maps/place/?q=place_id:ChIJqYTlQgXL44kRrKF__H_Au4E"><ManagedText id="f2a8b5067b750fae442765bf" fallback={"Directions ↗"} /></a></div><div className="border-t border-black/10 pt-5 md:border-l md:border-t-0 md:pl-8 md:pt-0"><p className="text-xs font-black uppercase tracking-[.22em] text-[#eb2327]"><ManagedText id="1469b3ac2e21a9c78c8a2ba5" fallback={"Next stop"} /></p><h3 className="brand-heading mt-3 text-4xl"><ManagedText id="75cbd2d2857c69522cc18f88" fallback={"SOMERSET PLAZA"} /><br/><ManagedText id="e581cc838b24674f6e372b97" fallback={"NASHUA"} /></h3><p className="mt-4 text-sm text-black/65"><ManagedText id="e5f1e81ef0858c7e60f4f71c" fallback={"Coming soon. The second cookie counter is on the way."} /></p></div></div></section>
      <section id="rewards" className="mx-auto max-w-[1400px] scroll-mt-24 px-5 py-12 md:px-12"><h2 className="brand-heading text-5xl"><ManagedText id="rewards-heading" fallback="REWARDS" /></h2><p className="mt-4 text-sm leading-7"><ManagedText id="rewards-description" fallback="Join Chunki Chip Rewards, check your points, and view available rewards through Square Loyalty." /></p><a href="https://profile.squareup.com/merchantportal/MLGF722JEEMCW/loyalty" className="soft-action mt-6 inline-flex min-h-12 items-center justify-center px-6 py-3 font-bold text-white">Join or check rewards</a></section>
      <EmailSignup />
    </main>
  );
}
