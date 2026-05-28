export default function RefundsPage() {
  return (
    <main className="min-h-screen bg-[#fff7f9] px-6 py-24 text-[#2b140d] md:px-10">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-[#eb2327]">
          Legal
        </p>

        <h1 className="brand-heading mt-4 text-6xl leading-none md:text-7xl">
          REFUND
          <br />
          POLICY
        </h1>

        <div className="mt-12 rounded-[2.5rem] border border-[#ffe3f3] bg-white p-8 shadow-xl md:p-12">
          <div className="space-y-8 text-base leading-8 text-[#6f4b3e]">
            <p>
              Because Chunki Chip products are freshly baked and perishable, all
              sales are generally final once an order is prepared or fulfilled.
            </p>

            <p>
              If your order arrives damaged, incorrect, or incomplete, please
              contact us as soon as possible with your order details and photos
              when applicable.
            </p>

            <p>
              Refunds, replacements, or store credit may be issued at our
              discretion depending on the situation.
            </p>

            <p>
              We are unable to guarantee refunds for delays caused by incorrect
              delivery information, missed deliveries, weather, carrier delays,
              or circumstances outside our control.
            </p>

            <p>
              Our goal is to make every order right whenever reasonably
              possible.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}