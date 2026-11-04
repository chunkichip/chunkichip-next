import type { Metadata } from 'next';
import ManagedText, { ManagedImage } from '@/components/ManagedText';

export const metadata: Metadata = {
  title: 'Intellectual Property & Brand Guidelines | Chunki Chip',
  description: 'Chunki Chip brand names, Chuck artwork, original photography, packaging, and guidelines for using our intellectual property.',
  alternates: { canonical: '/intellectual-property' },
};

const sections = [
  { id: 'names', number: '01', title: 'Brand names & logos', body: 'Chunki Chip uses its name, logos, and product branding to identify its business and products. Examples include Chunki Chip and Chiptinis™. These names and designs should not be used to identify another business or to suggest a connection with us without authorization.' },
  { id: 'artwork', number: '02', title: 'Chuck & original artwork', body: 'Chuck is the character featured in Chunki Chip’s brand identity. Our original character illustrations, graphic designs, and promotional artwork are part of our creative work. Commercial reproduction, alteration, or use on merchandise requires permission from the applicable rights holder.' },
  { id: 'photography', number: '03', title: 'Photography & creative content', body: 'Our original cookie photographs, videos, written descriptions, and promotional graphics are protected to the extent provided by copyright law. Buying a cookie or finding an image online does not transfer rights in the photograph or artwork. This notice concerns the creative content, rather than ownership of general cookie flavors, ingredients, or ideas.' },
  { id: 'packaging', number: '04', title: 'Packaging & printed materials', body: 'Chunki Chip’s branded boxes, labels, stickers, and printed materials feature our names, illustrations, and graphic arrangements. Please do not reproduce those materials or use our branding on packaging for another business. The box artwork below is a representative example of our branded presentation.' },
  { id: 'presentation', number: '05', title: 'Brand presentation & trade dress', body: 'Our visual identity brings together pink and red, our logo, Chuck, typography, signage, and packaging graphics. Where a distinctive overall presentation is legally protected as trade dress, we reserve the applicable rights. This is not a claim to exclusive ownership of individual colors, standard packaging shapes, or common bakery concepts.' },
  { id: 'permissions', number: '06', title: 'Using the Chunki Chip brand', body: 'Please contact us before reproducing our artwork, selling branded merchandise, or using our brand in a commercial campaign. Do not present yourself as Chunki Chip, register confusingly similar business identities, or imply an endorsement, partnership, or sponsorship that we have not approved.' },
];
const photos = [
  { src: '/archive/banana-cream-isolated.webp', alt: 'Chunki Chip Banana Cream cookie photograph' },
  { src: '/archive/blueberry-pancake-isolated.webp', alt: 'Chunki Chip Blueberry Pancake cookie photograph' },
  { src: '/archive/apple-cider-donut-isolated.webp', alt: 'Chunki Chip Apple Cider Donut cookie photograph' },
];

export default function IntellectualPropertyPage() {
  return <main className="soft-page min-h-screen px-5 py-12 text-[#171315] md:px-12 md:py-16">
    <div className="mx-auto max-w-6xl">
      <header className="border-b border-black/15 pb-10">
        <p className="text-xs font-black uppercase tracking-[.22em] text-[#eb2327]"><ManagedText id="ip-eyebrow" fallback="The Chunki Chip brand" /></p>
        <h1 className="brand-heading mt-4 text-[clamp(3rem,8vw,6rem)] leading-[.95]"><ManagedText id="ip-heading" fallback="INTELLECTUAL PROPERTY" /></h1>
        <p className="mt-6 max-w-3xl text-base leading-8"><ManagedText id="ip-intro" fallback="Our name, character, artwork, and brand presentation help customers recognize Chunki Chip. This page highlights examples of our intellectual property and explains how to request permission to use it." /></p>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-black/65"><ManagedText id="ip-scope" fallback="This is an illustrative list, not a complete inventory. Rights depend on the work, use, and applicable law. An item’s absence from this page does not mean that it is available for unrestricted use." /></p>
      </header>
      <nav aria-label="On this page" className="my-8 flex flex-wrap gap-3">{sections.map(section => <a key={section.id} href={'#'+section.id} className="rounded-full border border-black/15 bg-white px-4 py-3 text-xs font-bold hover:border-[#eb2327]">{section.number} <ManagedText id={'ip-'+section.id+'-title'} fallback={section.title} /></a>)}</nav>
      {sections.map(section => <section key={section.id} id={section.id} className="scroll-mt-28 border-t border-black/15 py-10 md:py-12">
        <p className="text-xs font-black tracking-[.2em] text-[#eb2327]">{section.number}</p>
        <h2 className="brand-heading mt-3 text-4xl md:text-5xl"><ManagedText id={'ip-'+section.id+'-title'} fallback={section.title} /></h2>
        <p className="mt-5 max-w-4xl text-base leading-8"><ManagedText id={'ip-'+section.id+'-body'} fallback={section.body} /></p>
        {section.id === 'names' && <div className="mt-8 grid items-center gap-6 bg-white p-6 md:grid-cols-[1fr_2fr] md:p-10">
          <ManagedImage cmsId="image-ip-logo" src="/logo.png" alt="Chunki Chip logo featuring Chuck" className="mx-auto h-48 w-48 object-contain" />
          <div className="grid gap-5"><p className="brand-heading text-4xl">CHUNKI CHIP</p><p className="brand-heading text-4xl">CHIPTINIS™</p><p className="text-sm text-black/65"><ManagedText id="ip-marks-note" fallback="The Chunki Chip name, Chiptinis™ product name, and logo featuring Chuck." /></p></div>
        </div>}
        {section.id === 'photography' && <div className="mt-8 grid gap-4 sm:grid-cols-3">{photos.map((photo,index) => <figure key={photo.src} className="bg-white p-6"><ManagedImage cmsId={'image-ip-photo-'+index} src={photo.src} alt={photo.alt} className="h-52 w-full object-contain" loading="lazy" /><figcaption className="mt-4 text-center text-xs text-black/65">Chunki Chip product photography</figcaption></figure>)}</div>}
        {section.id === 'packaging' && <figure className="mt-8 bg-white p-6 md:p-10"><ManagedImage cmsId="image-ip-packaging" src="/boxes/6-box.png" alt="Red Chunki Chip six-cookie box artwork with branded lettering and cookie graphics" className="mx-auto max-h-[440px] w-full object-contain" loading="lazy" /><figcaption className="mt-5 text-center text-xs text-black/65"><ManagedText id="ip-packaging-caption" fallback="Representative Chunki Chip cookie box artwork." /></figcaption></figure>}
        {section.id === 'permissions' && <div className="mt-8 border-l-4 border-[#eb2327] bg-white p-6">
          <h3 className="font-bold"><ManagedText id="ip-lawful-use-title" fallback="Reviews, reporting & third-party brands" /></h3>
          <p className="mt-3 text-sm leading-7"><ManagedText id="ip-lawful-use" fallback="This notice does not restrict lawful reviews, reporting, commentary, fair use, or other uses permitted by law. Customers remain free to share their own cookie photos and honest experiences. Names and logos of other brands referenced in our flavor descriptions belong to their respective owners; their use does not imply sponsorship or affiliation." /></p>
        </div>}
      </section>)}
      <section className="bg-[#ffccef] p-7 md:p-10">
        <h2 className="brand-heading text-4xl"><ManagedText id="ip-contact-title" fallback="QUESTIONS & PERMISSION REQUESTS" /></h2>
        <p className="mt-4 max-w-3xl text-sm leading-7"><ManagedText id="ip-contact" fallback="For licensing, media assets, collaborations, or a concern about use of our intellectual property, contact Chunki Chip. Tell us what you would like to use and where it will appear. Requests do not grant permission unless we agree in writing." /></p>
        <a href="/contact" className="mt-6 inline-block rounded-full bg-[#eb2327] px-6 py-4 text-sm font-bold text-white">Contact Chunki Chip</a>
      </section>
    </div>
  </main>;
}
