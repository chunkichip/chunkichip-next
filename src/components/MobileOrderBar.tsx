'use client';

import { useEffect, useState } from 'react';
import { useCartStore } from '@/store/cart';

export default function MobileOrderBar() {
  const [mounted, setMounted] = useState(false);
  const totalItems = useCartStore((state) => state.totalItems());

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (totalItems > 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 px-5 pb-5 pt-3 backdrop-blur-xl md:hidden">
      <a
        href="/#single-cookies"
        className="inline-flex h-[50px] w-full items-center justify-center rounded-full bg-black px-[30px] text-base font-semibold text-white shadow-2xl transition hover:scale-[1.02]"
      >
        Order Now
      </a>
    </div>
  );
}