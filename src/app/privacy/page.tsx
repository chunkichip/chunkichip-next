import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Chunki Chip',
  description: 'How Chunki Chip handles website, order, and job application information.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#fff7f9] px-6 py-24 text-[#2b140d] md:px-10">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-[#eb2327]">
          Legal
        </p>

        <h1 className="brand-heading mt-4 text-6xl leading-none md:text-7xl">
          PRIVACY
          <br />
          POLICY
        </h1>

        <div className="mt-12 rounded-[2.5rem] border border-[#ffe3f3] bg-white p-8 shadow-xl md:p-12">
          <div className="space-y-8 text-base leading-8 text-[#6f4b3e]">
            <p>
              Chunki Chip respects your privacy and is committed to protecting
              your personal information.
            </p>

            <p>
              We may collect information including your name, email address,
              shipping information, phone number, and payment-related details
              when you place orders, join rewards programs, or interact with our
              website.
            </p>

            <p>
              Payment information is securely processed through third-party
              payment providers including Square. Chunki Chip does not directly
              store full payment card information.
            </p>

            <p>
              Customer information may be used for order fulfillment, customer
              support, rewards programs, marketing communications, promotions,
              and improving our services.
            </p>

            <p>
              If you apply for a job, we collect the contact and experience
              details you submit to review your application and contact you
              about employment. Applications are stored in our database and
              are not visible to the public.
            </p>

            <p>
              We do not sell customer personal information to third parties.
            </p>

            <p>
              By using this website, you consent to the collection and use of
              information in accordance with this policy.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
