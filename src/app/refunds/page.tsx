
import ManagedText from '@/components/ManagedText';
export default function RefundsPage() {
  return (
    <main className="min-h-screen bg-[#fff7f9] px-6 py-24 text-[#2b140d] md:px-10">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-[#eb2327]"><ManagedText id="80686cb3de70af8ad09702b0" fallback={"Legal"} /></p>

        <h1 className="brand-heading mt-4 text-6xl leading-none md:text-7xl"><ManagedText id="41348edf84c15fe308c06cb9" fallback={"REFUND"} /><br /><ManagedText id="8ed0c88bd9925ffba997b693" fallback={"POLICY"} /></h1>

        <div className="mt-12 rounded-[2.5rem] border border-[#ffe3f3] bg-white p-8 shadow-xl md:p-12">
          <div className="space-y-8 text-base leading-8 text-[#6f4b3e]">
            <p><ManagedText id="91eec012866849e31e610765" fallback={"Because Chunki Chip products are freshly baked and perishable, all sales are generally final once an order is prepared or fulfilled."} /></p>

            <p><ManagedText id="b5a8a23fa67252ab8f5363a3" fallback={"If your order arrives damaged, incorrect, or incomplete, please contact us as soon as possible with your order details and photos when applicable."} /></p>

            <p><ManagedText id="c5eceb4d6595ecf02e8c7199" fallback={"Refunds, replacements, or store credit may be issued at our discretion depending on the situation."} /></p>

            <p><ManagedText id="86f4be1b532869e42e64bb9b" fallback={"We are unable to guarantee refunds for delays caused by incorrect delivery information, missed deliveries, weather, carrier delays, or circumstances outside our control."} /></p>

            <p><ManagedText id="912c2599703e6221679ab2c6" fallback={"Our goal is to make every order right whenever reasonably possible."} /></p>
          </div>
        </div>
      </div>
    </main>
  );
}
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy | Chunki Chip',
  description: 'Refund and order issue information for Chunki Chip customers.',
  alternates: { canonical: '/refunds' },
};

