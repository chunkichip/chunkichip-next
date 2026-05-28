'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/store/cart';

export default function SuccessPage() {
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[#fff7f9] px-6 py-20 text-[#2b140d]">
      <section className="relative w-full max-w-3xl overflow-hidden rounded-[3rem] border border-[#ffe3f3] bg-white p-10 text-center shadow-2xl md:p-16">
        <div className="absolute left-[-120px] top-[-120px] h-[260px] w-[260px] rounded-full bg-pink-200 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-120px] h-[260px] w-[260px] rounded-full bg-red-200 blur-3xl" />

        <div className="relative z-10">
          <img
            src="/loading.png"
            alt="Success"
            className="mx-auto h-28 w-28 object-contain"
          />

          <p className="mt-8 text-sm font-black uppercase tracking-[0.3em] text-[#eb2327]">
            Order Confirmed
          </p>

          <h1 className="brand-heading mt-4 text-6xl leading-none md:text-7xl">
            COOKIES
            <br />
            INCOMING
          </h1>

          <p className="mx-auto mt-8 max-w-xl text-lg leading-8 text-[#6f4b3e]">
            Your order was placed successfully and the kitchen is getting to
            work.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="/"
              className="inline-flex h-[54px] items-center justify-center rounded-full bg-black px-8 text-base font-semibold text-white transition hover:scale-[1.02]"
            >
              Back To Menu
            </a>

            <a
              href="/#cookies"
              className="inline-flex h-[54px] items-center justify-center rounded-full border border-[#ffccef] bg-white px-8 text-base font-semibold text-[#2b140d] transition hover:scale-[1.02]"
            >
              Order More
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}