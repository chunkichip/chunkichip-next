import type { Metadata } from 'next';
import ManagedText from '@/components/ManagedText';

export const metadata: Metadata = {
  title: 'Locations & Contact | Chunki Chip Milford, NH',
  description: 'Contact Chunki Chip Cookies at (603) 554-8571 or visit 183 Elm St, Unit 8, Milford, NH 03055. Find directions and ask about orders, catering, or brand permissions.',
  alternates: { canonical: '/contact' },
};

const directions = 'https://www.google.com/maps/place/?q=place_id:ChIJqYTlQgXL44kRrKF__H_Au4E';

export default function ContactPage() {
  return <main className="soft-page min-h-screen px-5 py-12 text-[#171315] md:px-12 md:py-16">
    <div className="mx-auto max-w-5xl">
      <h1 className="brand-heading text-5xl leading-none md:text-7xl"><ManagedText id="contact-heading" fallback="LOCATIONS & CONTACT" /></h1>
      <p className="mt-6 max-w-2xl text-base leading-8"><ManagedText id="contact-intro" fallback="Questions about an order, catering, a collaboration, or using the Chunki Chip brand? Get in touch with the shop." /></p>
      <section aria-labelledby="milford-contact-heading" className="mt-10 grid gap-8 rounded-2xl bg-white p-7 md:grid-cols-2 md:p-10">
        <div>
          <h2 id="milford-contact-heading" className="brand-heading text-4xl">MILFORD, NH</h2>
          <address className="mt-5 text-base not-italic leading-8">Chunki Chip Cookies<br/>183 Elm St, Unit 8<br/>Milford, NH 03055</address>
          <a href={directions} className="mt-5 inline-block font-bold underline underline-offset-4">Directions & current hours →</a>
        </div>
        <div>
          <h2 className="brand-heading text-4xl">CONTACT THE SHOP</h2>
          <p className="mt-5 text-lg font-bold">(603) 554-8571</p>
          <a href="tel:+16035548571" className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-[#eb2327] px-7 py-4 font-bold text-white">Call Chunki Chip</a>
          <p className="mt-5 text-sm leading-7"><ManagedText id="contact-permissions" fallback="For media, licensing, or permission requests, call us to discuss what you would like to use and where it will appear." /></p>
        </div>
      </section>
      <section className="mt-8 border-l-4 border-[#eb2327] bg-[#ffccef] p-7">
        <h2 className="brand-heading text-3xl">SOMERSET PLAZA, NASHUA</h2>
        <p className="mt-3 text-sm leading-7"><ManagedText id="contact-nashua" fallback="Coming soon. Our Milford shop can help with questions in the meantime." /></p>
      </section>
    </div>
  </main>;
}
