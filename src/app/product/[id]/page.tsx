'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Minus, Plus } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { getWeeklyFlavors, isInPersonCookieBox, isShippingOnlyProduct } from '@/lib/catalog';

type Modifier = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string | null;
  priceAmount: number;
  price: string;
};

type ModifierSet = {
  id: string;
  name: string;
  minSelected: number;
  maxSelected: number;
  modifiers: Modifier[];
};

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
  shippingOnly?: boolean;
  modifierSets?: ModifierSet[];
};

type StoreLocation = { id: string; name: string; address: string };
type OrderMethod = 'pickup' | 'curbside' | 'shipping';
type OrderStep = 'fulfillment' | 'location' | 'method' | 'size';

type Props = { params: Promise<{ id: string }> };
type Slot = { left: string; top: string };

const slotsBySize: Record<string, Slot[]> = {
  '1': [{ left: '50%', top: '65%' }],
  '2': [
    { left: '38%', top: '65%' },
    { left: '62%', top: '65%' },
  ],
  '4': [
    { left: '22%', top: '62%' },
    { left: '41%', top: '62%' },
    { left: '60%', top: '62%' },
    { left: '78%', top: '62%' },
  ],
  '6': [
    { left: '27%', top: '53%' },
    { left: '50%', top: '53%' },
    { left: '73%', top: '53%' },
    { left: '27%', top: '72%' },
    { left: '50%', top: '72%' },
    { left: '73%', top: '72%' },
  ],
  '12': [
    { left: '21.85%', top: '48.45%' },
    { left: '40.65%', top: '48.45%' },
    { left: '59.4%', top: '48.45%' },
    { left: '78.15%', top: '48.45%' },
    { left: '21.85%', top: '63.2%' },
    { left: '40.65%', top: '63.2%' },
    { left: '59.4%', top: '63.2%' },
    { left: '78.15%', top: '63.2%' },
    { left: '21.85%', top: '77.98%' },
    { left: '40.65%', top: '77.98%' },
    { left: '59.4%', top: '77.98%' },
    { left: '78.15%', top: '77.98%' },
  ],
};

const boxArtSizes = new Set(['4', '6', '12']);
const api = (path: string) => `${process.env.NEXT_PUBLIC_API_URL || ''}${path}`;
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

function formatPrice(amount: number) {
  return `$${(amount / 100).toFixed(2)}`;
}

export default function ProductPage({ params }: Props) {
  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<StoreLocation[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [added, setAdded] = useState(false);
  const [error, setError] = useState('');
  const [orderStep, setOrderStep] = useState<OrderStep | null>(null);
  const [fulfillmentChoice, setFulfillmentChoice] = useState<'pickup' | 'delivery' | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<OrderMethod | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState('');
  const [startingCheckout, setStartingCheckout] = useState(false);
  const [orderError, setOrderError] = useState('');
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const { id } = await params;
        const [response, locationResponse] = await Promise.all([
          fetch(api('/api/products')),
          fetch(api('/api/locations')),
        ]);
        if (!response.ok) throw new Error('The menu is temporarily unavailable.');
        const products = await response.json();
        const locationData = locationResponse.ok ? await locationResponse.json() : [];
        if (!active) return;

        const catalog = Array.isArray(products)
          ? (products as Product[]).map((item) => ({ ...item, shippingOnly: isShippingOnlyProduct(item) }))
          : [];
        setAllProducts(catalog);
        const flavor = getWeeklyFlavors(catalog).find((item) => item.id === id);
        setProduct(catalog.find((item) => item.id === id) || (flavor ? {
          id: flavor.id,
          name: flavor.name,
          description: flavor.description || '',
          imageUrl: flavor.imageUrl || null,
          variationId: null,
          priceAmount: flavor.priceAmount || 0,
          price: flavor.price || '',
          isBox: false,
          boxSize: null,
          shippingOnly: false,
          modifierSets: [],
        } : null));
        setLocations(Array.isArray(locationData) ? locationData : []);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Could not load this box.');
      }
    }

    load();
    return () => { active = false; };
  }, [params]);

  const options = useMemo(
    () => product?.modifierSets?.flatMap((set) => set.modifiers) || [],
    [product],
  );
  const cookieProducts = useMemo(
    () => allProducts.filter((item) => !item.isBox),
    [allProducts],
  );
  const selectedCount = Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0);
  const maxCookies = Number(product?.boxSize || product?.modifierSets?.[0]?.maxSelected || 0);
  const slots = product ? (slotsBySize[product.boxSize || ''] || []) : [];
  const selectedModifiers = options.flatMap((option) =>
    Array.from({ length: quantities[option.id] || 0 }, () => option),
  );
  const selectedCost = selectedModifiers.reduce((sum, option) => sum + (Number(option.priceAmount) || 0), 0);
  const totalPrice = (Number(product?.priceAmount) || 0) + selectedCost;
  const numberedBoxes = useMemo(
    () => allProducts
      .filter(isInPersonCookieBox)
      .sort((a, b) => Number(a.boxSize || 0) - Number(b.boxSize || 0)),
    [allProducts],
  );
  const flavorBoxChoices = useMemo(() => {
    if (!product) return [];
    return numberedBoxes.flatMap((box) => {
      const boxModifiers = (box.modifierSets || []).flatMap((set) => set.modifiers);
      const flavor = boxModifiers.find((modifier) => normalize(modifier.name) === normalize(product.name))
        || boxModifiers.find((modifier) => normalize(modifier.name).startsWith(normalize(product.name)) || normalize(product.name).startsWith(normalize(modifier.name)));
      return flavor ? [{ box, flavor }] : [];
    });
  }, [numberedBoxes, product]);

  function goBackInOrder() {
    setOrderError('');
    if (orderStep === 'size') setOrderStep('method');
    else if (orderStep === 'method') setOrderStep('location');
    else if (orderStep === 'location') setOrderStep('fulfillment');
    else setOrderStep(null);
  }

  async function continueToSquareCheckout() {
    if (!product || !selectedMethod || !selectedLocationId || !selectedSizeId) return;
    const selection = flavorBoxChoices.find(({ box }) => box.id === selectedSizeId);
    if (!selection) {
      setOrderError('This flavor is not available in that box size right now.');
      return;
    }

    setStartingCheckout(true);
    setOrderError('');
    try {
      const cookieCount = Number(selection.box.boxSize || 1);
      const response = await fetch(api('/api/create-checkout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkoutMethod: selectedMethod,
          ...(selectedMethod === 'shipping' ? { deliveryType: 'direct' } : {}),
          locationId: selectedLocationId,
          items: [{
            variationId: selection.box.variationId,
            name: selection.box.name,
            quantity: 1,
            selectedFlavors: Array.from({ length: cookieCount }, () => ({ id: selection.flavor.id })),
          }],
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.url) throw new Error(result.error || 'Could not start checkout. Please try again.');
      window.location.assign(result.url);
    } catch (checkoutError) {
      setOrderError(checkoutError instanceof Error ? checkoutError.message : 'Could not start checkout. Please try again.');
      setStartingCheckout(false);
    }
  }

  function increase(option: Modifier) {
    if (selectedCount >= maxCookies) return;
    setQuantities((previous) => ({ ...previous, [option.id]: (previous[option.id] || 0) + 1 }));
    setAdded(false);
  }

  function decrease(option: Modifier) {
    if (!quantities[option.id]) return;
    setQuantities((previous) => ({ ...previous, [option.id]: Math.max((previous[option.id] || 0) - 1, 0) }));
    setAdded(false);
  }

  function addCurrentProductToCart() {
    if (!product || (maxCookies > 0 && selectedCount !== maxCookies)) return;

    addItem({
      productId: product.id,
      variationId: product.variationId,
      name: product.name,
      priceAmount: totalPrice,
      price: formatPrice(totalPrice),
      imageUrl: product.imageUrl,
      isBox: product.isBox,
      boxSize: product.boxSize,
      shippingOnly: Boolean(product.shippingOnly),
      selectedFlavors: selectedModifiers.map((option) => ({
        id: option.id,
        name: option.name,
        imageUrl: cookieImage(option),
      })),
    });

    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  function cookieImage(option: Modifier) {
    return option.imageUrl || cookieProducts.find((cookie) => normalize(cookie.name) === normalize(option.name))?.imageUrl || null;
  }

  function BoxPreview() {
    if (!product) return null;
    const hasBrandedArt = boxArtSizes.has(product.boxSize || '');
    const cookieSize = product.boxSize === '12' ? '14%' : product.boxSize === '6' ? '16%' : product.boxSize === '4' ? '15%' : '17%';

    return (
      <div className="relative mx-auto aspect-square w-[68vw] max-w-full lg:w-full lg:max-w-[620px]">
        {hasBrandedArt ? (
          <img
            src={`/boxes/${product.boxSize}-box.png`}
            alt="Open Chunki Chip box"
            className="block h-full w-full object-contain drop-shadow-2xl"
          />
        ) : (
          <div className="absolute inset-0 overflow-hidden rounded-[2rem] border-[10px] border-[#d9161d] bg-gradient-to-br from-[#ff3438] to-[#c90d16] shadow-2xl">
            <div className="absolute inset-x-[6%] top-[12%] flex h-[24%] items-center justify-center border-b-[6px] border-[#b80c14] bg-[#ed1e24] text-center text-white">
              <span className="brand-heading text-[clamp(2.5rem,7vw,5.5rem)] leading-[.8]">OH, THAT’S<br/>CHUNKI™</span>
            </div>
            <div className={`absolute inset-x-[8%] bottom-[8%] top-[42%] grid items-center justify-items-center gap-2 rounded-xl border-4 border-[#b80c14] bg-[#ee2026] p-3 ${maxCookies <= 1 ? 'grid-cols-1' : 'grid-cols-2'}`} />
          </div>
        )}

        {slots.slice(0, maxCookies).map((slot, index) => {
          const option = selectedModifiers[index];
          const imageUrl = option ? cookieImage(option) : null;
          return (
            <div
              key={`${index}-${option?.id || 'empty'}`}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
              style={{ left: slot.left, top: slot.top, width: cookieSize, height: cookieSize }}
            >
              {imageUrl ? (
                <img src={imageUrl} alt={option?.name || ''} className="h-full w-full animate-[cookiePop_0.4s] rounded-full object-contain drop-shadow-[0_10px_12px_rgba(0,0,0,0.32)]" />
              ) : (
                <span className={`flex h-full w-full items-center justify-center rounded-full border-2 border-white bg-[#fff7fb] text-sm font-black text-[#eb2327] shadow-lg ${option ? '' : 'opacity-95'}`}>
                  {option ? '🍪' : index + 1}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (error) {
    return <main className="min-h-screen bg-[#fffafc] px-5 py-20 text-center"><p className="font-semibold">{error}</p><Link href="/#boxes" className="mt-6 inline-flex items-center gap-2 font-black uppercase text-[#eb2327]"><ArrowLeft size={16}/> Back to boxes</Link></main>;
  }

  if (!product) {
    return <main className="min-h-screen bg-[#fffafc] px-5 py-20 text-center"><p className="font-black uppercase tracking-[.2em]">Loading your box…</p></main>;
  }

  if (!product.isBox) {
    return (
      <main className="min-h-screen bg-[#fffafc] px-5 pb-16 pt-8 text-[#171315] md:px-10">
        <div className="mx-auto max-w-6xl">
          <Link href="/#single-cookies" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.16em]"><ArrowLeft size={16}/> Back to weekly flavors</Link>
          <div className="mt-8 grid overflow-hidden border-2 border-black bg-white md:grid-cols-2">
            <div className="flex min-h-[360px] items-center justify-center bg-[#ffccef] p-7 md:min-h-[560px]">{product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="max-h-[500px] w-full object-contain"/> : <span className="text-8xl" aria-hidden="true">🍪</span>}</div>
            <div className="flex flex-col justify-center p-6 md:p-12"><p className="text-xs font-black uppercase tracking-[.22em] text-[#eb2327]">This week’s flavor</p><h1 className="brand-heading mt-4 text-6xl md:text-8xl">{product.name}</h1><p className="mt-5 text-lg leading-7">{product.description || 'A fresh-baked Chunki Chip favorite.'}</p><p className="mt-6 text-xs font-black uppercase tracking-[.16em]">Starting at {numberedBoxes[0]?.price || product.price} · Choose pickup or delivery</p><button onClick={() => { setOrderError(''); setSelectedSizeId(''); setSelectedMethod(null); setSelectedLocationId(''); setFulfillmentChoice(null); setOrderStep('fulfillment'); }} className="mt-7 inline-flex min-h-14 items-center justify-center gap-3 border-2 border-black bg-[#eb2327] px-7 py-4 text-sm font-black uppercase tracking-wide text-white transition hover:bg-black">Order now <ArrowRight size={18}/></button></div>
          </div>
        </div>

        {orderStep && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="order-flow-title">
            <div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto border-2 border-black bg-[#fffafc] p-5 shadow-[8px_8px_0_#eb2327] sm:p-8">
              <div className="flex items-start justify-between gap-4 border-b-2 border-black pb-5">
                <div><p className="text-xs font-black uppercase tracking-[.2em] text-[#eb2327]">{product.name} · Step {orderStep === 'fulfillment' ? '1' : orderStep === 'location' ? '2' : orderStep === 'method' ? '3' : '4'} of 4</p><h2 id="order-flow-title" className="brand-heading mt-2 text-4xl leading-none sm:text-5xl">{orderStep === 'fulfillment' ? 'PICKUP OR DELIVERY?' : orderStep === 'location' ? 'CHOOSE A LOCATION' : orderStep === 'method' ? fulfillmentChoice === 'pickup' ? 'HOW SHOULD WE HAND IT OFF?' : 'DELIVERY' : 'CHOOSE YOUR BOX SIZE'}</h2></div>
                <button type="button" onClick={() => { setOrderStep(null); setOrderError(''); }} aria-label="Close ordering" className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black bg-white text-2xl">×</button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {orderStep === 'fulfillment' && <>
                  <button type="button" onClick={() => { setFulfillmentChoice('pickup'); setOrderStep('location'); }} className="min-h-32 border-2 border-black bg-white p-5 text-left transition hover:bg-[#ffccef]"><span className="text-xs font-black uppercase tracking-[.15em] text-[#eb2327]">Pick up fresh</span><span className="brand-heading mt-3 block text-3xl">PICKUP</span><span className="mt-2 block text-sm">Choose a shop, then curbside or carry out.</span></button>
                  <button type="button" onClick={() => { setFulfillmentChoice('delivery'); setOrderStep('location'); }} className="min-h-32 border-2 border-black bg-white p-5 text-left transition hover:bg-[#ffccef]"><span className="text-xs font-black uppercase tracking-[.15em] text-[#eb2327]">Delivered to you</span><span className="brand-heading mt-3 block text-3xl">DELIVERY</span><span className="mt-2 block text-sm">Enter your delivery address at secure Square checkout.</span></button>
                </>}

                {orderStep === 'location' && (locations.length ? locations.map((location) => <button type="button" key={location.id} onClick={() => { setSelectedLocationId(location.id); setOrderStep('method'); }} className={`min-h-28 border-2 border-black p-5 text-left transition hover:bg-[#ffccef] ${selectedLocationId === location.id ? 'bg-[#ffccef]' : 'bg-white'}`}><span className="text-xs font-black uppercase tracking-[.15em] text-[#eb2327]">Chunki Chip</span><span className="brand-heading mt-2 block text-3xl">{location.name}</span><span className="mt-1 block text-sm">{location.address}</span></button>) : <p className="border-2 border-[#eb2327] bg-white p-5 text-sm font-semibold sm:col-span-2">Online ordering is not available right now. Please contact the shop.</p>)}

                {orderStep === 'method' && (fulfillmentChoice === 'pickup' ? <>
                  <button type="button" onClick={() => { setSelectedMethod('curbside'); setOrderStep('size'); }} className="min-h-32 border-2 border-black bg-white p-5 text-left transition hover:bg-[#ffccef]"><span className="text-xs font-black uppercase tracking-[.15em] text-[#eb2327]">We’ll bring it out</span><span className="brand-heading mt-3 block text-3xl">CURBSIDE</span><span className="mt-2 block text-sm">Park outside and let us know when you arrive.</span></button>
                  <button type="button" onClick={() => { setSelectedMethod('pickup'); setOrderStep('size'); }} className="min-h-32 border-2 border-black bg-white p-5 text-left transition hover:bg-[#ffccef]"><span className="text-xs font-black uppercase tracking-[.15em] text-[#eb2327]">Come inside</span><span className="brand-heading mt-3 block text-3xl">CARRY OUT</span><span className="mt-2 block text-sm">Pick up your order at the counter.</span></button>
                </> : <button type="button" onClick={() => { setSelectedMethod('shipping'); setOrderStep('size'); }} className="min-h-32 border-2 border-black bg-white p-5 text-left transition hover:bg-[#ffccef] sm:col-span-2"><span className="text-xs font-black uppercase tracking-[.15em] text-[#eb2327]">Address collected at checkout</span><span className="brand-heading mt-3 block text-3xl">DELIVERY</span><span className="mt-2 block text-sm">Square will collect the delivery address securely.</span></button>)}

                {orderStep === 'size' && (flavorBoxChoices.length ? flavorBoxChoices.map(({ box }) => <button type="button" key={box.id} onClick={() => setSelectedSizeId(box.id)} className={`flex min-h-24 items-center justify-between border-2 border-black p-5 text-left transition hover:bg-[#ffccef] ${selectedSizeId === box.id ? 'bg-[#ffccef] shadow-[4px_4px_0_#eb2327]' : 'bg-white'}`}><span><span className="brand-heading block text-3xl">{box.name}</span><span className="mt-1 block text-xs font-black uppercase tracking-[.12em]">{box.boxSize} {Number(box.boxSize) === 1 ? 'cookie' : 'cookies'} · {selectedMethod === 'shipping' ? 'Delivery' : selectedMethod === 'curbside' ? 'Curbside' : 'Carry out'}</span></span><span className="text-lg font-black">{box.price}</span></button>) : <p className="border-2 border-[#eb2327] bg-white p-5 text-sm font-semibold sm:col-span-2">No numbered cookie boxes are currently available with this flavor.</p>)}
              </div>

              {orderError && <p role="alert" className="mt-5 border-2 border-[#eb2327] bg-white p-4 text-sm font-bold">{orderError}</p>}
              {orderStep === 'size' && <button type="button" disabled={!selectedSizeId || startingCheckout} onClick={continueToSquareCheckout} className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 border-2 border-black bg-black px-5 py-4 text-sm font-black uppercase tracking-wide text-white transition hover:bg-[#eb2327] disabled:cursor-not-allowed disabled:opacity-40">{startingCheckout ? 'Connecting to Square…' : 'Continue to secure checkout'} <ArrowRight size={18}/></button>}
              {orderStep !== 'fulfillment' && <button type="button" onClick={goBackInOrder} className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.15em]"><ArrowLeft size={15}/> Back</button>}
            </div>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffafc] px-4 pb-32 pt-5 text-[#171315] md:px-8 md:pb-16">
      <style>{`@keyframes cookiePop { 0% { transform: scale(.4) rotate(-14deg); opacity: 0; } 75% { transform: scale(1.08) rotate(3deg); opacity: 1; } 100% { transform: scale(1) rotate(0); opacity: 1; } }`}</style>
      <div className="mx-auto max-w-[1440px]">
        <Link href={product.shippingOnly ? '/#shipping-boxes' : '/#boxes'} className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.16em] transition hover:text-[#eb2327]"><ArrowLeft size={16}/> {product.shippingOnly ? 'Shipping boxes' : 'Pickup box sizes'}</Link>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_.95fr] lg:items-start">
          <div className="sticky top-[72px] z-30 bg-[#fffafc] pb-2 lg:top-[104px] lg:bg-transparent lg:pb-0">
            <div className="overflow-hidden border-2 border-black bg-[#ffccef] p-2 md:p-6">
              <div className="mb-1 flex items-center justify-between text-[10px] font-black uppercase tracking-[.18em] md:mb-2 md:text-xs"><span>{product.shippingOnly ? 'Shipping box preview' : 'Live box preview'}</span><span>{selectedCount} / {maxCookies} picked</span></div>
              <div className="overflow-hidden rounded-xl bg-[#ffdeef]/70"><BoxPreview/></div>
              <div className="mt-1 flex items-center justify-between border-t-2 border-black pt-2 text-[10px] font-black uppercase tracking-[.12em] md:mt-3 md:pt-3 md:text-xs"><span>{product.name}</span><span>{formatPrice(totalPrice)}</span></div>
            </div>
            <p className="mt-1 hidden text-[10px] font-semibold uppercase tracking-[.12em] text-black/65 md:mt-3 md:block md:text-xs">Your selection appears in the box as you build.</p>
          </div>

          <div className="border-2 border-black bg-white p-4 md:p-7">
            <div className="flex items-start justify-between gap-4 border-b-2 border-black pb-5">
              <div><p className="text-xs font-black uppercase tracking-[.2em] text-[#eb2327]">{product.shippingOnly ? 'Build a shipping box' : 'Build your box'}</p><h1 className="brand-heading mt-2 text-5xl leading-[.88] md:text-7xl">{product.name}</h1><p className="mt-4 max-w-lg text-sm leading-6">{product.shippingOnly ? 'Choose your cookies. This box ships nationwide.' : 'Choose your cookies. This box is available for pickup or curbside.'}</p></div>
              <span className="shrink-0 bg-[#eb2327] px-3 py-2 text-sm font-black text-white md:px-4 md:text-base">{product.price}</span>
            </div>

            <div className="mt-5 flex items-center justify-between"><h2 className="brand-heading text-3xl md:text-4xl">Pick your flavors</h2><span className="text-xs font-black uppercase tracking-[.12em]">{selectedCount} / {maxCookies}</span></div>
            <div className="mt-3 h-2 border border-black bg-[#fffafc]"><div className="h-full bg-[#eb2327] transition-[width] duration-300" style={{ width: `${maxCookies ? Math.min(100, (selectedCount / maxCookies) * 100) : 0}%` }}/></div>

            {options.length ? (
              <div className="mt-4 grid max-h-[540px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {options.map((option) => {
                  const quantity = quantities[option.id] || 0;
                  const imageUrl = cookieImage(option);
                  return (
                    <article key={option.id} className={`grid grid-cols-[70px_1fr] items-center gap-3 border-2 border-black p-2 transition ${quantity ? 'bg-[#ffccef]' : 'bg-white'}`}>
                      <div className="flex h-[70px] items-center justify-center bg-[#fff3fa]">{imageUrl ? <img src={imageUrl} alt="" className="h-full w-full object-contain p-1"/> : <span className="text-3xl" aria-hidden="true">🍪</span>}</div>
                      <div className="min-w-0"><h3 className="line-clamp-2 text-sm font-black leading-tight">{option.name}</h3><p className="mt-1 text-xs font-semibold">{option.price || 'Included'}</p><div className="mt-2 flex items-center gap-2"><button type="button" onClick={() => decrease(option)} disabled={!quantity} aria-label={`Remove one ${option.name}`} className="flex h-8 w-8 items-center justify-center border border-black bg-white disabled:opacity-30"><Minus size={15}/></button><span className="min-w-5 text-center text-sm font-black" aria-live="polite">{quantity}</span><button type="button" onClick={() => increase(option)} disabled={selectedCount >= maxCookies} aria-label={`Add one ${option.name}`} className="flex h-8 w-8 items-center justify-center border border-black bg-white disabled:opacity-30"><Plus size={15}/></button></div></div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 border-2 border-dashed border-black p-5 text-sm font-medium">Flavor choices are temporarily unavailable for this box. Please check back soon.</p>
            )}

            <div className="mt-5 flex items-center justify-between gap-4 border-t-2 border-black pt-4">
              <div><p className="text-xs font-black uppercase tracking-[.12em]">Box total</p><p className="brand-heading mt-1 text-4xl">{formatPrice(totalPrice)}</p></div>
              <button type="button" onClick={addCurrentProductToCart} disabled={(maxCookies > 0 && selectedCount !== maxCookies) || options.length === 0} className={`hidden min-h-14 flex-1 bg-black px-4 py-4 text-sm font-black uppercase tracking-wide text-white transition hover:bg-[#eb2327] disabled:cursor-not-allowed disabled:opacity-35 md:flex md:flex-none md:min-w-[220px] ${added ? 'bg-[#eb2327]' : ''}`}>
                {added ? 'Added to bag' : selectedCount === maxCookies ? product.shippingOnly ? 'Add shipping box' : 'Add box to bag' : `Add ${Math.max(maxCookies - selectedCount, 0)} more`}
              </button>
            </div>
          </div>
        </section>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-black bg-white p-3 md:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[.12em]">{selectedCount} / {maxCookies} · {formatPrice(totalPrice)}</p><p className="truncate text-xs font-semibold">{product.name}</p></div>
          <button type="button" onClick={addCurrentProductToCart} disabled={(maxCookies > 0 && selectedCount !== maxCookies) || options.length === 0} className={`min-h-12 shrink-0 bg-black px-4 text-xs font-black uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-35 ${added ? 'bg-[#eb2327]' : ''}`}>
            {added ? 'Added' : selectedCount === maxCookies ? product.shippingOnly ? 'Ship box' : 'Add box' : `Pick ${Math.max(maxCookies - selectedCount, 0)} more`}
          </button>
        </div>
      </div>
    </main>
  );
}
