'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUpRight, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { isInPersonCookieBox, isInternalPackaging, isShippingOnlyProduct } from '@/lib/catalog';

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
  const [added, setAdded] = useState('');
  const addItem = useCartStore((state) => state.addItem);

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
  const cookies = products.filter((product) =>
    !isInPersonCookieBox(product) && !isShippingOnlyProduct(product) && !isInternalPackaging(product),
  );

  function addProduct(product: Product) {
    addItem({
      productId: product.id,
      variationId: product.variationId,
      name: product.name,
      priceAmount: product.priceAmount,
      price: product.price,
      imageUrl: product.imageUrl,
      isBox: product.isBox,
      boxSize: product.boxSize,
      shippingOnly: isShippingOnlyProduct(product),
    });
    setAdded(`${product.name} added to your bag`);
    window.setTimeout(() => setAdded(''), 2200);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#fffafc] text-[#171315]">
      <section className="relative border-b-2 border-black bg-[#ffccef] px-5 pb-14 pt-12 md:px-12 md:pb-20 md:pt-16">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex items-center justify-between border-b-2 border-black pb-4 text-[11px] font-black uppercase tracking-[.2em]">
            <a href="/" aria-label="Chunki Chip home">CHUNKI CHIP®</a>
            <span>Milford, NH · Fresh baked daily</span>
            <a href="#menu" className="flex items-center gap-2">Order online <ShoppingBag size={16}/></a>
          </div>
          <div className="grid items-end gap-10 pt-12 md:grid-cols-[1.3fr_.7fr] md:pt-20">
            <div>
              <p className="mb-5 inline-block bg-[#eb2327] px-3 py-2 text-xs font-black uppercase tracking-[.16em] text-white">Big cookie energy</p>
              <h1 className="brand-heading text-[clamp(5rem,15vw,13.5rem)] leading-[.78] tracking-[-.055em] text-[#eb2327]">COOKIE<br/>CULTURE.</h1>
            </div>
            <div className="md:pb-2">
              <p className="max-w-md text-xl font-semibold leading-snug md:text-2xl">Ridiculously thick cookies. Loud flavors. Made in New Hampshire and shipped nationwide.</p>
              <a href="#menu" className="mt-8 inline-flex items-center gap-3 border-2 border-black bg-black px-6 py-4 text-sm font-black uppercase tracking-wide text-white transition hover:bg-[#eb2327]">Shop the menu <ArrowDown size={18}/></a>
            </div>
          </div>
          <div className="mt-12 flex flex-wrap gap-x-8 gap-y-2 border-t-2 border-black pt-4 text-[10px] font-black uppercase tracking-[.18em]">
            <span>01 / Amherst Street</span><span>02 / Somerset Plaza coming soon</span><span>Cookie boxes · Chiptinis™ · Catering</span>
          </div>
        </div>
      </section>

      <section id="menu" className="mx-auto max-w-[1400px] px-5 py-14 md:px-12 md:py-20">
        <div className="flex flex-col justify-between gap-5 border-b-2 border-black pb-5 md:flex-row md:items-end">
          <div><p className="text-xs font-black uppercase tracking-[.22em] text-[#eb2327]">The current lineup</p><h2 className="brand-heading mt-3 text-6xl md:text-8xl">PICK YOUR<br className="md:hidden"/> FIX.</h2></div>
          <p className="max-w-sm text-sm font-medium leading-relaxed">Pickup boxes and nationwide shipping boxes are listed separately. Cookie names, photos, and prices sync from Square.</p>
        </div>

        {error && <div role="alert" className="mt-8 border-2 border-[#eb2327] bg-white p-5 font-semibold">{error}<p className="mt-1 text-sm font-normal">Please call the shop or try again later.</p></div>}
        {loading && <p className="py-14 text-center font-black uppercase tracking-widest">Loading today’s cookies…</p>}

        {!loading && !error && <>
          {inPersonBoxes.length > 0 && (
            <div id="boxes" className="mt-10 scroll-mt-24">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div><p className="text-xs font-black uppercase tracking-[.2em] text-[#eb2327]">In-store pickup or curbside</p><h3 className="brand-heading mt-2 text-4xl md:text-5xl">BUILD A BOX</h3></div>
                <span className="text-xs font-black uppercase tracking-widest">Numbered cookie boxes</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {inPersonBoxes.map((product) => (
                  <Link key={product.id} href={`/product/${encodeURIComponent(product.id)}`} className="group flex min-h-[190px] flex-col justify-between border-2 border-black bg-white p-5 text-left transition hover:-translate-y-1 hover:bg-[#ffccef] focus-visible:outline-[#eb2327]">
                    <div><span className="text-xs font-black uppercase tracking-[.18em] text-[#eb2327]">{product.boxSize} cookies</span><h4 className="brand-heading mt-3 text-4xl">{product.name}</h4></div>
                    <span className="flex items-center justify-between border-t border-black pt-3 text-sm font-bold"><span>{product.price}</span><span className="flex items-center gap-1 uppercase">Build <ArrowUpRight size={16}/></span></span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {shippingBoxes.length > 0 && (
            <div id="shipping-boxes" className="mt-14 scroll-mt-24">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div><p className="text-xs font-black uppercase tracking-[.2em] text-[#eb2327]">Nationwide shipping only</p><h3 className="brand-heading mt-2 text-4xl md:text-5xl">SHIP A BOX</h3></div>
                <span className="text-xs font-black uppercase tracking-widest">Packed for the trip</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {shippingBoxes.map((product, index) => {
                  const hasBuilder = product.isBox && Boolean(product.modifierSets?.some((set) => set.modifiers.length));
                  return (
                    <Link key={product.id} href={`/product/${encodeURIComponent(product.id)}`} className="group grid grid-cols-[38%_1fr] border-2 border-black bg-white transition hover:-translate-y-1 hover:bg-[#fff4fa]">
                      <div className={`flex min-h-[175px] items-center justify-center ${index % 3 === 1 ? 'bg-[#ffccef]' : index % 3 === 2 ? 'bg-[#eb2327]' : 'bg-[#f2eeec]'}`}>
                        {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="h-36 w-full object-contain p-2"/> : <span className="text-6xl">🍪</span>}
                      </div>
                      <div className="flex min-w-0 flex-col justify-between p-4">
                        <div><span className="text-[10px] font-black uppercase tracking-[.15em] text-[#eb2327]">Shipping only</span><h4 className="brand-heading mt-2 text-2xl leading-tight">{product.name}</h4><p className="mt-2 line-clamp-3 text-xs leading-relaxed text-black/70">{product.description}</p></div>
                        <span className="mt-4 flex items-center justify-between border-t border-black pt-3 text-sm font-bold"><span>{product.price}</span><span className="flex items-center gap-1 uppercase">{hasBuilder ? 'Build' : 'View'} <ArrowUpRight size={16}/></span></span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div id="single-cookies" className="mt-14 scroll-mt-24">
            <div className="mb-4 flex items-end justify-between"><h3 className="brand-heading text-4xl md:text-5xl">COOKIES & MORE</h3><span className="text-xs font-black uppercase tracking-widest">Made for the group chat</span></div>
            {cookies.length === 0 ? <p className="border-2 border-dashed border-black p-8 text-center">Our menu is being refreshed. Check back soon.</p> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cookies.map((product, index) => <article key={product.id} className="grid grid-cols-[38%_1fr] border-2 border-black bg-white"><div className={`flex min-h-[170px] items-center justify-center ${index % 3 === 1 ? 'bg-[#ffccef]' : index % 3 === 2 ? 'bg-[#eb2327]' : 'bg-[#f2eeec]'}`}>{product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="h-36 w-full object-contain p-2"/> : <span className="text-6xl">🍪</span>}</div><div className="flex flex-col justify-between p-4"><div><h4 className="brand-heading text-2xl leading-tight">{product.name}</h4><p className="mt-2 line-clamp-3 text-xs leading-relaxed text-black/70">{product.description}</p></div><div className="mt-4 flex items-center justify-between"><span className="font-black">{product.price}</span><button onClick={() => addProduct(product)} className="bg-black px-3 py-2 text-xs font-black uppercase tracking-wide text-white hover:bg-[#eb2327]">Add +</button></div></div></article>)}</div>}
          </div>
        </>}

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          <a href="https://www.doordash.com/store/chunki-chip-milford-39514093/107306346/" className="border-2 border-black bg-[#eb2327] p-6 text-white"><span className="text-xs font-black uppercase tracking-widest">Local delivery</span><h3 className="brand-heading mt-4 text-4xl">DOORDASH</h3><span className="mt-4 inline-block text-sm font-bold underline underline-offset-4">Order nearby ↗</span></a>
          <a href="#shipping-boxes" className="border-2 border-black bg-[#ffccef] p-6"><span className="text-xs font-black uppercase tracking-widest">Send Chunki nationwide</span><h3 className="brand-heading mt-4 text-4xl">SHIPPING BOXES</h3><span className="mt-4 inline-block text-sm font-bold underline underline-offset-4">Choose a box ↗</span></a>
          <a href="#locations" className="border-2 border-black bg-white p-6"><span className="text-xs font-black uppercase tracking-widest">Find a cookie</span><h3 className="brand-heading mt-4 text-4xl">COME BY</h3><span className="mt-4 inline-block text-sm font-bold underline underline-offset-4">Hours & locations ↗</span></a>
        </div>
      </section>

      <section id="locations" className="border-y-2 border-black bg-black px-5 py-12 text-white md:px-12"><div className="mx-auto grid max-w-[1400px] gap-8 md:grid-cols-2"><div><p className="text-xs font-black uppercase tracking-[.22em] text-[#ffccef]">Find us</p><h2 className="brand-heading mt-3 text-5xl md:text-6xl">MILFORD, NEW HAMPSHIRE</h2><p className="mt-4 max-w-lg text-sm leading-6 text-white/75">Fresh baked in Milford. Find current hours and directions on Google, or order local delivery through DoorDash.</p><a className="mt-5 inline-block text-sm font-bold underline underline-offset-4" href="https://maps.google.com/?q=Chunki+Chip+Milford+NH">Directions ↗</a></div><div className="border-t border-white/30 pt-5 md:border-l md:border-t-0 md:pl-8 md:pt-0"><p className="text-xs font-black uppercase tracking-[.22em] text-[#ffccef]">Next stop</p><h3 className="brand-heading mt-3 text-4xl">SOMERSET PLAZA<br/>NASHUA</h3><p className="mt-4 text-sm text-white/75">Coming soon. The second cookie counter is on the way.</p></div></div></section>
      <footer className="flex flex-col justify-between gap-3 px-5 py-6 text-xs font-bold uppercase tracking-[.12em] md:flex-row md:px-12"><span>© Chunki Chip · Baked in New Hampshire</span><span>Cookies before plans.</span><a href="https://chunkichip.com">Shipping & more ↗</a></footer>
      {added && <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 border-2 border-black bg-[#ffccef] px-5 py-3 text-sm font-black shadow-[4px_4px_0_#000]">{added}</div>}
    </main>
  );
}
