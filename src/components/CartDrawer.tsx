'use client';

import { useEffect, useState } from 'react';
import { useCartStore } from '@/store/cart';
import CookieSpinner from '@/components/CookieSpinner';
import ShippingCheckout from '@/components/ShippingCheckout';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  onBuildAnotherBox: () => void;
};

type CheckoutMethod =
  | 'pickup'
  | 'curbside'
  | 'shipping';

const DOORDASH_URL =
  'https://www.doordash.com/store/chunki-chip-milford-39514093/107306346/';

export default function CartDrawer({ open, setOpen, onBuildAnotherBox }: Props) {
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [methodModalOpen, setMethodModalOpen] = useState(false);
  const [shippingFlowOpen, setShippingFlowOpen] = useState(false);

  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const increaseQuantity = useCartStore((state) => state.increaseQuantity);
  const decreaseQuantity = useCartStore((state) => state.decreaseQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const totalItems = useCartStore((state) => state.totalItems);
  const totalAmount = useCartStore((state) => state.totalAmount);
  const hasShippingOnlyProducts = items.some((item) => item.shippingOnly);
  const hasOnlyShippingProducts = items.length > 0 && items.every((item) => item.shippingOnly);

  useEffect(() => {
    document.body.style.overflow = open || methodModalOpen || shippingFlowOpen ? 'hidden' : 'auto';

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [open, methodModalOpen, shippingFlowOpen]);

  async function handleCheckout(checkoutMethod: CheckoutMethod) {
    try {
      setLoadingCheckout(true);
      setMethodModalOpen(false);

      const res = await fetch(
        '/api/create-checkout',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items,
            checkoutMethod,
          }),
        }
      );

      const data = await res.json();

      if (data.url) {
        if (data.curbsideCheckinUrl) { try { localStorage.setItem('chunki-curbside-checkin', data.curbsideCheckinUrl); } catch {} }
        window.location.href = data.url;
        return;
      }

      alert(data.error || 'Checkout failed');
      setLoadingCheckout(false);
    } catch {
      alert('Checkout failed');
      setLoadingCheckout(false);
    }
  }

  function beginShippingCheckout() {
    setMethodModalOpen(false);
    setShippingFlowOpen(true);
  }

  return (
    <>
      {loadingCheckout && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/90 backdrop-blur-md">
          <CookieSpinner size={96}/>

          <h2 className="brand-heading mt-6 text-4xl text-[#eb2327]">
            Preparing Your Order
          </h2>

          <p className="mt-3 text-sm font-medium tracking-wide text-[#6f4b3e]">
            Redirecting to secure checkout...
          </p>
        </div>
      )}

      {methodModalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[2.5rem] bg-white p-6 shadow-2xl md:p-8">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em] text-[#eb2327]">
                  Checkout
                </p>

                <h2 className="brand-heading mt-2 text-5xl leading-none">
                  HOW DO YOU WANT IT?
                </h2>
              </div>

              <button
                onClick={() => setMethodModalOpen(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#ffccef] text-2xl text-[#eb2327]"
              >
                ×
              </button>
            </div>

            <div className="mt-8 grid gap-4">
              {hasShippingOnlyProducts && (
                <p className="border-2 border-[#eb2327] bg-[#fff7fb] p-4 text-sm font-bold text-[#171315]">
                  Your bag has a shipping-only box. Choose Nationwide Shipping to continue.
                </p>
              )}
              {!hasOnlyShippingProducts && (
                <p className="border-2 border-black bg-[#fff7fb] p-4 text-sm font-bold text-[#171315]">
                  Live shipping quotes are available for shipping box products. Add only shipping boxes to your bag before checking out by mail.
                </p>
              )}
              <button
                onClick={() => handleCheckout('pickup')}
                disabled={hasShippingOnlyProducts}
                className="rounded-[2rem] border border-[#ffe3f3] bg-[#fff7fb] p-5 text-left transition hover:-translate-y-1 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40"
              >
                <h3 className="text-xl font-black text-[#2b140d]">
                  In-Store Pickup
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#6f4b3e]">
                  Place your order through Square and pick it up fresh.
                </p>
              </button>

	<button
  onClick={() => handleCheckout('curbside')}
  disabled={hasShippingOnlyProducts}
  className="rounded-[2rem] border border-[#ffe3f3] bg-[#fff7fb] p-5 text-left transition hover:-translate-y-1 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40"
>
  <h3 className="text-xl font-black text-[#2b140d]">
    Curbside Pickup
  </h3>

  <p className="mt-2 text-sm leading-6 text-[#6f4b3e]">
    Keep your check-in page open. When parked, tap “I’m here” and enter your vehicle details.
  </p>
</button>
              <button
                onClick={beginShippingCheckout}
                disabled={!hasOnlyShippingProducts}
                className="rounded-[2rem] border border-[#ffe3f3] bg-[#fff7fb] p-5 text-left transition hover:-translate-y-1 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40"
              >
                <h3 className="text-xl font-black text-[#2b140d]">
                  Nationwide Shipping
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#6f4b3e]">
                  Enter your address to compare current carrier rates, then pay securely through Square.
                </p>
              </button>

              <a
                href={DOORDASH_URL}
                target="_blank"
                rel="noreferrer"
                className="rounded-[2rem] border border-[#ffe3f3] bg-black p-5 text-left text-white transition hover:-translate-y-1 hover:shadow-xl"
              >
                <h3 className="text-xl font-black">DoorDash Delivery</h3>

                <p className="mt-2 text-sm leading-6 text-white/75">
                  Order local delivery through DoorDash.
                </p>
              </a>
            </div>
          </div>
        </div>
      )}

      {shippingFlowOpen && <ShippingCheckout items={items} onClose={() => setShippingFlowOpen(false)} />}

      {open && (
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-labelledby="cart-title">
          <button
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          <aside
            className={`
              absolute bottom-0 right-0 flex h-[92vh] w-full flex-col
              rounded-t-[2rem] border-t border-[#ffe3f3] bg-white shadow-2xl
              transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
              md:top-0 md:h-full md:max-w-md md:rounded-none md:border-l md:border-t-0
              ${
                open
                  ? 'translate-y-0 opacity-100 md:translate-x-0'
                  : 'translate-y-full opacity-0 md:translate-y-0 md:translate-x-full'
              }
            `}
          >
            <div className="flex items-center justify-between border-b border-[#ffe3f3] px-5 py-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#eb2327]">
                  Your Order
                </p>

                <h2 id="cart-title" className="brand-heading mt-2 text-4xl">CART</h2>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ffe3f3] text-xl font-semibold text-[#2b140d] transition hover:bg-[#fff7fb]"
              >
                ×
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-10 text-center">
                <div className="text-7xl">🍪</div>

                <h3 className="brand-heading mt-6 text-4xl">EMPTY CART</h3>

                <p className="mt-4 max-w-xs text-sm leading-7 text-[#6f4b3e]">
                  Add some giant cookies and build your perfect box.
                </p>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                  {items.map((item) => (
                    <div
                      key={item.cartId}
                      className="rounded-[2rem] border border-[#ffe3f3] bg-white p-4"
                    >
                      <div className="flex gap-4">
                        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[1.5rem] bg-[#fff7fb]">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="max-h-[80%] object-contain"
                            />
                          ) : (
                            <span className="text-4xl">🍪</span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="brand-heading text-2xl leading-none">
                              {item.name}
                            </h3>

                            <span className="rounded-full bg-[#eb2327] px-3 py-1 text-xs font-semibold text-white">
                              $
                              {(
                                (item.priceAmount * item.quantity) /
                                100
                              ).toFixed(2)}
                            </span>
                          </div>

                          {item.shippingOnly && <p className="mt-2 text-[10px] font-black uppercase tracking-[.15em] text-[#eb2327]">Nationwide shipping only</p>}

                          {item.isBox && item.selectedFlavors?.length ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {item.selectedFlavors.map((flavor, index) => (
                                <span
                                  key={`${flavor.id}-${index}`}
                                  className="rounded-full border border-[#ffccef] bg-[#fff7fb] px-3 py-1 text-[11px] font-medium text-[#eb2327]"
                                >
                                  {flavor.name}
                                </span>
                              ))}
                            </div>
                          ) : null}

                          <div className="mt-5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => decreaseQuantity(item.cartId)}
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ffccef] text-lg font-semibold text-[#eb2327]"
                              >
                                −
                              </button>

                              <span className="min-w-[24px] text-center text-sm font-semibold">
                                {item.quantity}
                              </span>

                              <button
                                onClick={() => increaseQuantity(item.cartId)}
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#ffccef] text-lg font-semibold text-[#eb2327]"
                              >
                                +
                              </button>
                            </div>

                            <button
                              onClick={() => removeItem(item.cartId)}
                              className="text-sm font-medium text-[#6f4b3e]"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#ffe3f3] p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#6f4b3e]">Total</p>

                      <h3 className="brand-heading text-4xl">
                        ${(totalAmount() / 100).toFixed(2)}
                      </h3>
                    </div>

                    <p className="text-sm text-[#6f4b3e]">
                      {totalItems()} items
                    </p>
                  </div>

                  <button
                    onClick={() => setMethodModalOpen(true)}
                    disabled={loadingCheckout}
                    className="flex h-[54px] w-full items-center justify-center rounded-full bg-black text-base font-semibold text-white shadow-xl transition hover:scale-[1.02] disabled:opacity-50"
                  >
                    Checkout
                  </button>

                  <button
                    type="button"
                    onClick={onBuildAnotherBox}
                    disabled={loadingCheckout}
                    className="mt-3 flex min-h-[50px] w-full items-center justify-center rounded-full border border-[#eb2327] px-5 py-3 font-semibold text-[#eb2327] disabled:opacity-50"
                  >
                    Build another box
                  </button>

                  <button
                    onClick={clearCart}
                    className="mt-4 w-full text-center text-sm font-medium text-[#6f4b3e]"
                  >
                    Clear Cart
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
