export default function ShippingPage() {
  return (
    <main className="min-h-screen bg-[#fff7f9] px-6 py-24 text-[#2b140d] md:px-10">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-[#eb2327]">
          Legal
        </p>

        <h1 className="brand-heading mt-4 text-6xl leading-none md:text-7xl">
          SHIPPING
          <br />
          POLICY
        </h1>

        <div className="mt-12 rounded-[2.5rem] border border-[#ffe3f3] bg-white p-8 shadow-xl md:p-12">
          <div className="space-y-8 text-base leading-8 text-[#6f4b3e]">
            <p>
              Chunki Chip offers local delivery and nationwide shipping for
              eligible cookie products.
            </p>

            <p>
              Local delivery may be fulfilled through DoorDash or another
              approved delivery partner. Delivery availability, timing, and fees
              may vary by location.
            </p>

            <p>
              Nationwide shipping orders are packed for freshness and shipped to
              the address provided at checkout. Shipping times may vary based on
              carrier availability, destination, weather, holidays, and order
              volume.
            </p>

            <p>
              Customers are responsible for entering a complete and accurate
              shipping address. Chunki Chip is not responsible for delays or
              failed deliveries caused by incorrect shipping information.
            </p>

            <p>
              Because our products are perishable, please retrieve packages
              promptly after delivery.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping | Chunki Chip',
  description: 'Shipping information for Chunki Chip cookie orders.',
  alternates: { canonical: '/shipping' },
};

