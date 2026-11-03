import type { Metadata } from 'next';
import ManagedText from '@/components/ManagedText';
export const metadata: Metadata = { title: 'Cookie Shop FAQ | Chunki Chip Milford, NH', description: 'Find Chunki Chip’s Milford address, ordering options, catering information, and allergy notice.', alternates: { canonical: '/faq' } };
const questions = [
  ['faq-location', 'Where is Chunki Chip?', 'Find us at 183 Elm St, Unit 8, Milford, NH 03055. Call (603) 554-8571 for current hours or questions.'],
  ['faq-order', 'How do I order cookies?', 'Choose a cookie box on our homepage and follow the ordering steps. Local delivery is also available through our DoorDash link.'],
  ['faq-shipping', 'Do you ship cookies?', 'Yes. Our shipping boxes are listed separately on the homepage for nationwide orders.'],
  ['faq-catering', 'Do you offer catering?', 'Yes. Visit the catering page or call the shop to discuss your event.'],
  ['faq-allergy', 'Where can I find allergy information?', 'Read our Allergy warning page and contact the shop before ordering if you have a food allergy.'],
];
export default function FAQ() { return <main className="soft-page min-h-screen px-5 py-14 md:px-12"><div className="mx-auto max-w-4xl"><h1 className="brand-heading text-6xl">FAQ</h1><div className="mt-8 grid gap-4">{questions.map(([id,q,a]) => <details key={id} className="soft-card bg-white p-6"><summary className="cursor-pointer font-bold"><ManagedText id={id+'-question'} fallback={q}/></summary><p className="mt-4 text-sm leading-7"><ManagedText id={id+'-answer'} fallback={a}/></p></details>)}</div><div className="mt-8 flex flex-wrap gap-6 font-bold underline"><a href="/#boxes">Order cookies</a><a href="/catering">Catering</a><a href="/allergy-notice">Allergy warning</a></div></div></main>; }
