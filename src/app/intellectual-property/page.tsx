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
        <p className="text-sm font-black uppercase tracking-[0.3em] text-[#eb2327]">
          Legal
        </p>

        <h1 className="brand-heading mt-4 text-6xl leading-none md:text-7xl">
          INTELLECTUAL
          <br />
          PROPERTY
        </h1>

        <div className="mt-12 rounded-[2.5rem] border border-[#ffe3f3] bg-white p-8 shadow-xl md:p-12">
          <div className="space-y-8 text-base leading-8 text-[#6f4b3e]">
            <p>
              All content displayed on the Chunki Chip website, including but
              not limited to logos, branding, product names, graphics,
              photography, website design, text, visual assets, marketing
              materials, and creative elements are the intellectual property of
              Chunki Chip unless otherwise stated.
            </p>

            <p>
              Unauthorized copying, reproduction, redistribution, resale,
              modification, or commercial use of any Chunki Chip intellectual
              property is strictly prohibited without prior written permission.
            </p>

            <p>
              Chunki Chip branding, visual identity, and original content may
              not be used in any manner that could cause confusion, imply
              affiliation, or misrepresent ownership.
            </p>

            <p>
              All trademarks, service marks, trade dress, and related branding
              elements remain the property of their respective owners.
            </p>

            <p>
              Requests regarding licensing, media usage, partnerships, or
              intellectual property concerns may be directed through our contact
              channels.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
