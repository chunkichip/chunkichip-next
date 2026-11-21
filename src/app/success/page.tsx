'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';

export default function SuccessPage() {
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <main className="soft-page flex min-h-[calc(100svh-6rem)] items-center justify-center px-5 py-12 text-[#171315] md:px-12 md:py-16">
      <section aria-labelledby="confirmation-heading" className="soft-card w-full max-w-3xl px-6 py-10 text-center sm:px-10 md:p-16">
        <div className="soft-inset mx-auto flex h-36 w-36 items-center justify-center rounded-full md:h-44 md:w-44">
          {/* Use the storefront's cookie mark without the loading animation. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/spinner-red.png" alt="Chunki Chip cookie" width={104} height={104} className="h-24 w-24 object-contain md:h-28 md:w-28"/>
        </div>

        <p className="mt-8 text-xs font-black uppercase tracking-[.22em] text-[#eb2327]">Order confirmed</p>
        <h1 id="confirmation-heading" className="brand-heading mt-4 text-6xl leading-[.95] sm:text-7xl md:text-8xl">COOKIES<br/>INCOMING.</h1>
        <p className="mx-auto mt-6 max-w-md text-base leading-7 text-black/70 md:text-lg md:leading-8">Thanks for your order! Your Square receipt has your order details and pickup or shipping information.</p>

        <div className="mx-auto mt-8 flex max-w-md flex-col justify-center gap-4 sm:flex-row">
          <Link href="/#single-cookies" className="soft-action inline-flex min-h-14 flex-1 items-center justify-center px-7 py-4 font-bold text-white">Back to menu</Link>
          <Link href="/#boxes" className="soft-card inline-flex min-h-14 flex-1 items-center justify-center rounded-full px-7 py-4 font-bold">Order more</Link>
        </div>
      </section>
    </main>
  );
}
