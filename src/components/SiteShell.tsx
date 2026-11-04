'use client';

import { useCallback, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CartUIContext } from './CartUIContext';
import Header from './Header';
import CartDrawer from './CartDrawer';
import MobileOrderBar from './MobileOrderBar';
import MenuDrawer from './MenuDrawer';
import PageTransition from './PageTransition';
import Footer from './Footer';

export default function SiteShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const builder = useRef<{ pathname: string; reset: () => void } | null>(null);
  const openCart = useCallback((resetBuilder?: () => void) => {
    if (resetBuilder) builder.current = { pathname, reset: resetBuilder };
    setCartOpen(true);
  }, [pathname]);
  function buildAnotherBox() {
    setCartOpen(false);
    if (builder.current?.pathname === pathname) {
      builder.current.reset();
      builder.current = null;
    } else {
      router.push('/#boxes');
    }
  }

  return (
    <CartUIContext.Provider value={{ openCart }}>
      <Header
        onCartClick={() => openCart()}
        onMenuClick={() => setMenuOpen(true)}
      />

      <PageTransition>
  {children}
</PageTransition>

      <MobileOrderBar />

      <Footer />

      <MenuDrawer open={menuOpen} setOpen={setMenuOpen} />

      <CartDrawer open={cartOpen} setOpen={setCartOpen} onBuildAnotherBox={buildAnotherBox} />
    </CartUIContext.Provider>
  );
}