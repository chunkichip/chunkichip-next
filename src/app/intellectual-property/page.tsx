
import ManagedText from '@/components/ManagedText';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Intellectual Property | Chunki Chip',
  description: 'Information about Chunki Chip brand, photography, artwork, and other intellectual property.',
  alternates: { canonical: '/intellectual-property' },
};

export default function IntellectualPropertyPage() {
  return (
    <main className="min-h-screen bg-[#fff7f9] px-6 py-24 text-[#2b140d] md:px-10">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-[#eb2327]"><ManagedText id="0a51368afa699efa50e19152" fallback={"Legal"} /></p>

        <h1 className="brand-heading mt-4 text-6xl leading-none md:text-7xl"><ManagedText id="2ef24d784bd55563addbe0be" fallback={"INTELLECTUAL"} /><br /><ManagedText id="714eeef79ea9d8e7eaef3618" fallback={"PROPERTY"} /></h1>

        <div className="mt-12 rounded-[2.5rem] border border-[#ffe3f3] bg-white p-8 shadow-xl md:p-12">
          <div className="space-y-8 text-base leading-8 text-[#6f4b3e]">
            <p><ManagedText id="fcf85d5fb3c04a20beda87e2" fallback={"All content displayed on the Chunki Chip website, including but not limited to logos, branding, product names, graphics, photography, website design, text, visual assets, marketing materials, and creative elements are the intellectual property of Chunki Chip unless otherwise stated."} /></p>

            <p><ManagedText id="c5f70497f906036c0077de1f" fallback={"Unauthorized copying, reproduction, redistribution, resale, modification, or commercial use of any Chunki Chip intellectual property is strictly prohibited without prior written permission."} /></p>

            <p><ManagedText id="f08a8731e971f7c200a6a033" fallback={"Chunki Chip branding, visual identity, and original content may not be used in any manner that could cause confusion, imply affiliation, or misrepresent ownership."} /></p>

            <p><ManagedText id="683f0b61b7b1abf8963b2aa8" fallback={"All trademarks, service marks, trade dress, and related branding elements remain the property of their respective owners."} /></p>

            <p><ManagedText id="74306cfe7cf14c738017a6c9" fallback={"Requests regarding licensing, media usage, partnerships, or intellectual property concerns may be directed through our contact channels."} /></p>
          </div>
        </div>
      </div>
    </main>
  );
}
