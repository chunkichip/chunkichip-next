'use client';

import { useState } from 'react';
import Header from './Header';
import CartDrawer from './CartDrawer';
import MobileOrderBar from './MobileOrderBar';
import MenuDrawer from './MenuDrawer';
import PageTransition from './PageTransition';
import DropListPopup from './DropListPopup';

export default function SiteShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <Header
        onCartClick={() => setCartOpen(true)}
        onMenuClick={() => setMenuOpen(true)}
      />

      <PageTransition>
  {children}
</PageTransition>

      <MobileOrderBar />

      <DropListPopup />

      <MenuDrawer open={menuOpen} setOpen={setMenuOpen} />

      <CartDrawer open={cartOpen} setOpen={setCartOpen} />
    </>
  );
}