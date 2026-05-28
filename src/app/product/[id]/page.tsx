'use client';

import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { useCartStore } from '@/store/cart';

type Product = {
  id: string;
  name: string;
  description: string;
  kitchenName: string;
  imageId: string | null;
  imageUrl: string | null;
  variationId: string | null;
  priceAmount: string;
  price: string;
  isBox: boolean;
  boxSize: string | null;
};

type Props = {
  params: Promise<{ id: string }>;
};

const boxSlots: Record<string, [string, string][]> = {
  '4': [
    ['22%', '62%'],
    ['41%', '62%'],
    ['60%', '62%'],
    ['78%', '62%'],
  ],
  '6': [
    ['27%', '53%'],
    ['50%', '53%'],
    ['73%', '53%'],
    ['2%', '72%'],
    ['50%', '72%'],
    ['73%', '72%'],
  ],
  '12': [
    ['18%', '47%'],
    ['39%', '47%'],
    ['60%', '47%'],
    ['80%', '47%'],
    ['18%', '64%'],
    ['39%', '64%'],
    ['60%', '64%'],
    ['80%', '64%'],
    ['18%', '80%'],
    ['39%', '80%'],
    ['60%', '80%'],
    ['80%', '80%'],
  ],
};

export default function ProductPage({ params }: Props) {
  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [added, setAdded] = useState(false);

  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    async function load() {
      const { id } = await params;
      const res = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/api/products`
);
      const products = await res.json();

      setAllProducts(Array.isArray(products) ? products : []);

      const found = Array.isArray(products)
        ? products.find((p: Product) => p.id === id)
        : null;

      setProduct(found || null);
    }

    load();
  }, [params]);

  const cookies = allProducts.filter((p) => !p.isBox);
  const maxCookies = Number(product?.boxSize || 0);
  const slots = product ? boxSlots[product.boxSize || '4'] || [] : [];

  const selectedCookies: Product[] = [];

  cookies.forEach((cookie) => {
    const qty = quantities[cookie.id] || 0;

    for (let i = 0; i < qty; i++) {
      selectedCookies.push(cookie);
    }
  });

  const limitedSelectedCookies = selectedCookies.slice(0, maxCookies);
  const totalSelected = limitedSelectedCookies.length;

  if (!product) {
    return (
      <main className="min-h-screen bg-white px-6 py-20 text-center">
        Loading...
      </main>
    );
  }

  function increase(cookie: Product) {
    if (totalSelected >= maxCookies) return;

    setQuantities((prev) => ({
      ...prev,
      [cookie.id]: (prev[cookie.id] || 0) + 1,
    }));

    setAdded(false);
  }

  function decrease(cookie: Product) {
    if (!quantities[cookie.id]) return;

    setQuantities((prev) => ({
      ...prev,
      [cookie.id]: Math.max((prev[cookie.id] || 0) - 1, 0),
    }));

    setAdded(false);
  }

  function getCookieSize() {
    if (product?.boxSize === '12') return '20%';
    if (product?.boxSize === '6') return '24%';
    return '22%';
  }

  function addCurrentProductToCart() {
  if (!product) return;

  addItem({
      productId: product.id,
      variationId: product.variationId,
      name: product.name,
      priceAmount: Number(product.priceAmount),
      price: product.price,
      imageUrl: product.imageUrl,
      isBox: product.isBox,
      boxSize: product.boxSize,
      selectedFlavors: product.isBox
        ? limitedSelectedCookies.map((cookie) => ({
            id: cookie.id,
            name: cookie.name,
            imageUrl: cookie.imageUrl,
          }))
        : undefined,
    });

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 1800);
  }

  return (
    <main className="min-h-screen bg-white px-4 pb-36 pt-2 text-[#2b140d] md:px-8">
      <style>{`
        @keyframes cookiePop {
          0% {
            transform: scale(0.35) rotate(-18deg);
            opacity: 0;
          }

          70% {
            transform: scale(1.1) rotate(4deg);
            opacity: 1;
          }

          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
      `}</style>

      <div className="mx-auto max-w-[1600px]">
        <a
          href="/"
          className="mb-4 inline-flex rounded-full border border-[#ffccef] px-5 py-2 text-sm font-semibold text-[#eb2327]"
        >
          ← Back to menu
        </a>

        {product.isBox ? (
          <section className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
            <div className="rounded-[2rem] border border-[#ffe3f3] bg-[#fff7fb] p-5">
              <div className="relative mx-auto max-w-5xl">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full object-contain drop-shadow-2xl"
                  />
                ) : (
                  <img
                    src={`/boxes/${product.boxSize}-box.png`}
                    alt={product.name}
                    className="w-full object-contain drop-shadow-2xl"
                  />
                )}

                {slots.map(([left, top], index) => {
                  const cookie = limitedSelectedCookies[index];
                  const cookieSize = getCookieSize();

                  return (
                    <div
                      key={`${index}-${cookie?.id || 'empty'}`}
                      className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                      style={{
                        left,
                        top,
                        width: cookieSize,
                        height: cookieSize,
                      }}
                    >
                      {cookie ? (
                        <img
                          src={cookie.imageUrl || ''}
                          alt={cookie.name}
                          className="h-full w-full rounded-full object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.28)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] animate-[cookiePop_0.45s]"
                        />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-sm font-semibold text-[#eb2327] shadow">
                          {index + 1}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#ffe3f3] bg-white p-5 md:p-7">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#eb2327]">
                    Build Your Box
                  </p>

                  <h1 className="brand-heading mt-2 text-5xl leading-none">
                    Select {maxCookies} Flavors
                  </h1>
                </div>

                <div className="rounded-full bg-[#eb2327] px-5 py-2 text-sm font-semibold text-white">
                  {product.price}
                </div>
              </div>

              <div className="mb-6 h-3 overflow-hidden rounded-full bg-[#fff7fb]">
                <div
                  className="h-full rounded-full bg-[#eb2327] transition-all"
                  style={{
                    width: `${(totalSelected / maxCookies) * 100}%`,
                  }}
                />
              </div>

              <div className="max-h-[620px] overflow-y-auto pr-2">
                <div className="space-y-3">
                  {cookies.map((cookie) => {
                    const qty = quantities[cookie.id] || 0;

                    return (
                      <div
                        key={cookie.id}
                        className="flex items-center justify-between rounded-2xl border border-[#ffe3f3] bg-[#fff7fb] p-3"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white">
                            {cookie.imageUrl ? (
                              <img
                                src={cookie.imageUrl}
                                alt={cookie.name}
                                className="max-h-[72px] object-contain"
                              />
                            ) : (
                              <div className="text-4xl">🍪</div>
                            )}
                          </div>

                          <h3 className="max-w-[220px] text-sm font-semibold leading-tight">
                            {cookie.name}
                          </h3>
                        </div>

                        <div className="flex items-center gap-3 rounded-full border border-[#ffccef] bg-white px-3 py-2">
                          <button
                            onClick={() => decrease(cookie)}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-[#eb2327] transition hover:bg-[#fff7fb]"
                          >
                            <Minus size={18} />
                          </button>

                          <span className="min-w-[20px] text-center text-sm font-semibold">
                            {qty}
                          </span>

                          <button
                            onClick={() => increase(cookie)}
                            disabled={totalSelected >= maxCookies}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-[#eb2327] transition hover:bg-[#fff7fb] disabled:opacity-30"
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between rounded-2xl bg-[#fff7fb] p-4">
                <div>
                  <p className="text-sm font-medium text-[#6f4b3e]">
                    Selected
                  </p>

                  <h2 className="brand-heading text-4xl">
                    {totalSelected}/{maxCookies}
                  </h2>
                </div>

                <button
                  disabled={totalSelected !== maxCookies}
                  onClick={addCurrentProductToCart}
                  className={`fixed bottom-5 left-5 right-5 z-40 flex h-[50px] items-center justify-center rounded-full px-8 text-base font-semibold text-white shadow-2xl transition enabled:hover:scale-[1.02] disabled:opacity-40 md:static md:min-w-[240px] ${
                    added ? 'bg-[#eb2327]' : 'bg-black'
                  }`}
                >
                  {added
                    ? 'Added To Cart!'
                    : totalSelected === maxCookies
                    ? 'Add Box To Cart'
                    : `Add ${maxCookies - totalSelected} More`}
                </button>
              </div>
            </div>
          </section>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="flex min-h-[360px] items-center justify-center rounded-[2rem] border border-[#ffe3f3] bg-[#fff7fb] p-8 md:min-h-[520px]">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="max-h-[460px] w-full object-contain drop-shadow-2xl"
                />
              ) : (
                <div className="text-8xl">🍪</div>
              )}
            </section>

            <section className="flex flex-col justify-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#eb2327]">
                Chunki Chip
              </p>

              <h1 className="brand-heading mt-3 text-6xl text-[#2b140d] md:text-7xl">
                {product.name}
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#6f4b3e]">
                {product.description}
              </p>

              <div className="mt-6 inline-flex w-fit rounded-full bg-[#eb2327] px-5 py-2 text-lg font-semibold text-white">
                {product.price}
              </div>

              <button
                onClick={addCurrentProductToCart}
                className={`mt-8 flex h-[54px] w-full max-w-md items-center justify-center rounded-full text-base font-semibold text-white shadow-xl transition hover:scale-[1.02] ${
                  added ? 'bg-[#eb2327]' : 'bg-black'
                }`}
              >
                {added ? 'Added To Cart!' : 'Add To Cart'}
              </button>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}