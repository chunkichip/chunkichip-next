import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Allergy Notice | Chunki Chip',
  description: 'Read important allergen information before ordering Chunki Chip cookies.',
  alternates: { canonical: '/allergy-notice' },
};

export default function AllergyNoticePage() {
  return <main className="soft-page min-h-screen px-5 py-14 text-[#171315] md:px-10 md:py-20"><article className="soft-card mx-auto max-w-4xl bg-white p-7 md:p-12"><p className="text-xs font-black uppercase tracking-[.22em] text-[#eb2327]">Before ordering</p><h1 className="brand-heading mt-4 text-5xl leading-[.9] md:text-7xl">ALLERGY NOTICE</h1><div className="mt-8 space-y-5 text-base leading-8 text-black/75"><p>Chunki Chip cookies and toppings vary by flavor. Product descriptions are not a complete ingredient or allergen statement, and recipes may change.</p><p>Our menu includes flavors made with common allergens, including wheat, milk, eggs, soy, peanuts, and tree nuts. Other ingredients or cross-contact may also be present during preparation.</p><p>If you have a food allergy or dietary restriction, call or text us at <a className="font-bold underline" href="tel:+16035548571">(603) 554-8571</a> before ordering so our team can discuss the current ingredients and preparation details. Please do not order if we cannot confirm a product is safe for you.</p><p>We cannot guarantee that any item is free from a particular allergen. When in doubt, please avoid the product.</p></div></article></main>;
}

