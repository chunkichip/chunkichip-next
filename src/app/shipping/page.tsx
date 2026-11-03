
import ManagedText from '@/components/ManagedText';
export default function ShippingPage() {
  return (
    <main className="min-h-screen bg-[#fff7f9] px-6 py-24 text-[#2b140d] md:px-10">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-[#eb2327]"><ManagedText id="02d123e2a4bf2adf969daf62" fallback={"Legal"} /></p>

        <h1 className="brand-heading mt-4 text-6xl leading-none md:text-7xl"><ManagedText id="f22a10db9c8eb7498e130514" fallback={"SHIPPING"} /><br /><ManagedText id="e809a8e71012086420afe498" fallback={"POLICY"} /></h1>

        <div className="mt-12 rounded-[2.5rem] border border-[#ffe3f3] bg-white p-8 shadow-xl md:p-12">
          <div className="space-y-8 text-base leading-8 text-[#6f4b3e]">
            <p><ManagedText id="5fae7838487bdaf1f7df57c3" fallback={"Chunki Chip offers local delivery and nationwide shipping for eligible cookie products."} /></p>

            <p><ManagedText id="2150fb75c97f1da6a4ca29d8" fallback={"Local delivery may be fulfilled through DoorDash or another approved delivery partner. Delivery availability, timing, and fees may vary by location."} /></p>

            <p><ManagedText id="e34e7dbea36242aa924a9830" fallback={"Nationwide shipping orders are packed for freshness and shipped to the address provided at checkout. Shipping times may vary based on carrier availability, destination, weather, holidays, and order volume."} /></p>

            <p><ManagedText id="d59d2d167168b20b60029685" fallback={"Customers are responsible for entering a complete and accurate shipping address. Chunki Chip is not responsible for delays or failed deliveries caused by incorrect shipping information."} /></p>

            <p><ManagedText id="850f2a9549bb613567cb4e37" fallback={"Because our products are perishable, please retrieve packages promptly after delivery."} /></p>
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

