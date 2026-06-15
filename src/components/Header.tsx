'use client';

import { useEffect, useState } from 'react';
import { Menu, ShoppingBag } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/store/cart';

export default function Header({
  onCartClick,
  onMenuClick,
}: {
  onCartClick: () => void;
  onMenuClick: () => void;
}) {
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [bounce, setBounce] = useState(false);

  const totalItems = useCartStore((state) => state.totalItems());
  const totalAmount = useCartStore((state) => state.totalAmount());

  const hideMobileCartBar = pathname.startsWith('/product');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    setBounce(true);

    const timeout = setTimeout(() => {
      setBounce(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [totalItems, mounted]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#ffccef] bg-white/95 backdrop-blur-xl">
        <div className="relative mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 md:h-[88px] md:px-8">
          <button
            onClick={onMenuClick}
            className="flex h-10 items-center gap-2 rounded-full text-[#eb2327] transition hover:scale-105 md:h-11"
          >
            <Menu size={24} strokeWidth={2.2} />

            <span className="hidden text-[15px] font-semibold tracking-tight md:block">
              Menu
            </span>
          </button>

          <div className="absolute left-1/2 top-[60%] z-10 -translate-x-1/2 -translate-y-1/2 md:top-[54%]">
            <a href="/">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-[#eb2327] bg-white shadow-xl transition hover:scale-105 md:h-24 md:w-24">
                <img
                  src="/logo.png"
                  alt="Chunki Chip"
                  className="h-[88%] w-[88%] object-contain"
                />
              </div>
            </a>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/#boxes"
              className="hidden h-11 items-center rounded-full bg-[#eb2327] px-5 text-[13px] font-semibold tracking-tight text-white shadow-lg transition hover:scale-105 md:flex md:px-6 md:text-sm"
            >
              Order Now
            </a>

            <button
              onClick={onCartClick}
              className={`relative flex h-10 w-10 items-center justify-center rounded-full text-[#eb2327] transition md:h-11 md:w-11 ${
                bounce ? 'scale-125' : 'scale-100 hover:scale-110'
              }`}
            >
              <ShoppingBag size={25} strokeWidth={2.2} />

              {mounted && totalItems > 0 && (
                <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#eb2327] text-[10px] font-bold text-white">
                  {totalItems}
                </div>
              )}
            </button>
          </div>
        </div>
      </header>

      {mounted && totalItems > 0 && !hideMobileCartBar && (
        <button
          onClick={onCartClick}
          className="fixed bottom-4 left-4 right-4 z-40 flex h-[60px] items-center justify-between rounded-full bg-black px-6 text-white shadow-2xl transition hover:scale-[1.01] md:hidden"
        >
          <div className="flex flex-col items-start">
            <span className="text-xs uppercase tracking-[0.2em] text-white/60">
              Cart
            </span>

            <span className="text-sm font-semibold">
              {totalItems} items
            </span>
          </div>

          <div className="brand-heading text-2xl">
            ${(totalAmount / 100).toFixed(2)}
          </div>

          <div className="rounded-full bg-[#eb2327] px-4 py-2 text-sm font-semibold">
            View Cart
          </div>
        </button>
      )}
    </>
  );
}