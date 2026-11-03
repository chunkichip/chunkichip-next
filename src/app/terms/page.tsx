
import ManagedText from '@/components/ManagedText';
export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#fff7f9] px-6 py-24 text-[#2b140d] md:px-10">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-[#eb2327]"><ManagedText id="e100cd8168aae339a253eba2" fallback={"Legal"} /></p>

        <h1 className="brand-heading mt-4 text-6xl leading-none md:text-7xl"><ManagedText id="96624d916241043bac1f37c7" fallback={"TERMS OF"} /><br /><ManagedText id="69e46b4d538ed9db9e82e1d3" fallback={"SERVICE"} /></h1>

        <div className="mt-12 rounded-[2.5rem] border border-[#ffe3f3] bg-white p-8 shadow-xl md:p-12">
          <div className="space-y-8 text-base leading-8 text-[#6f4b3e]">
            <p><ManagedText id="f86b5820d60b58fd49454996" fallback={"By accessing or using the Chunki Chip website, you agree to comply with and be bound by these Terms of Service."} /></p>

            <p><ManagedText id="9edb080c007ecc4f87f5426a" fallback={"Chunki Chip reserves the right to update products, pricing, availability, shipping methods, promotions, and website content at any time without prior notice."} /></p>

            <p><ManagedText id="020dd2c9618ff05af8252d10" fallback={"Customers agree to provide accurate information when placing orders, joining rewards programs, or submitting contact forms."} /></p>

            <p><ManagedText id="08ced1d60dfea1a3241259b1" fallback={"Unauthorized use of this website, including attempts to interfere with functionality, scrape content, reproduce materials, or misuse branding is prohibited."} /></p>

            <p><ManagedText id="138185804c5b979303b9e952" fallback={"Chunki Chip is not liable for indirect, incidental, or consequential damages arising from the use of this website or our products beyond the extent permitted by law."} /></p>

            <p><ManagedText id="3f1810be54cb8ac609b12e2f" fallback={"Continued use of the website constitutes acceptance of these terms."} /></p>
          </div>
        </div>
      </div>
    </main>
  );
}
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Use | Chunki Chip',
  description: 'Terms for using the Chunki Chip website and online ordering services.',
  alternates: { canonical: '/terms' },
};

