import ManagedText from '@/components/ManagedText';
const links = [
  ['Intellectual Property', '/intellectual-property'],
  ['Allergy warning', '/allergy-notice'],
  ['Press', '/press'],
  ['Privacy policy', '/privacy'],
  ['Terms', '/terms'],
  ['FAQ', '/faq'],
  ['Curbside check-in', '/curbside'],
];
export default function Footer() {
  return <footer className="border-t border-[#ffccef] bg-white px-5 py-10 pb-28 text-[#171315] md:px-12 md:pb-10">
    <div className="mx-auto max-w-[1400px]">
      <nav aria-label="Footer menu" className="flex flex-wrap gap-x-7 gap-y-4 text-sm font-semibold">
        {links.map(([label, href]) => <a key={href} href={href} className="hover:text-[#eb2327]">{label}</a>)}
      </nav>
      <p className="mt-8 text-xs text-black/60">© {new Date().getFullYear()} Chunki Chip. <ManagedText id="footer-rights" fallback="All rights reserved." /></p>
    </div>
  </footer>;
}
