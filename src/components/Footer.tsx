
import ManagedText, { ManagedImage } from '@/components/ManagedText';
export default function Footer() {
  return (
    <footer className="border-t border-[#ffe3f3] bg-white px-6 py-16 md:px-10">
      <div className="mx-auto grid max-w-7xl gap-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-[#eb2327] bg-white shadow-lg">
              <ManagedImage cmsId="image-c0626e016cec476c1568"
                src="/logo.png"
                alt="Chunki Chip"
                className="h-[84%] w-[84%] object-contain"
              />
            </div>

            <div>
              <h2 className="brand-heading text-4xl leading-none text-[#2b140d]"><ManagedText id="42906507e5398872dae2ee7e" fallback={"CHUNKI"} /></h2>
              <h2 className="brand-heading text-4xl leading-none text-[#eb2327]"><ManagedText id="ccc1b168541a748b8b625fae" fallback={"CHIP"} /></h2>
            </div>
          </div>

          <p className="mt-6 max-w-sm text-base leading-8 text-[#6f4b3e]"><ManagedText id="fb039c2e2045bc792c3670af" fallback={"Thick stuffed cookies, weekly flavor drops, and fresh baked boxes shipped nationwide."} /></p>
        </div>

        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.25em] text-[#eb2327]"><ManagedText id="3a142e7039322df37a7b54ae" fallback={"Explore"} /></h3>

          <div className="mt-6 flex flex-col gap-4">
            <a href="/#cookies" className="transition hover:text-[#eb2327]"><ManagedText id="cfd02922b576276d55c2e504" fallback={"Cookies"} /></a>
            <a href="/#boxes" className="transition hover:text-[#eb2327]"><ManagedText id="1a4ae8964d1946a5faac101f" fallback={"Build A Box"} /></a>
            <a href="/catering" className="transition hover:text-[#eb2327]"><ManagedText id="14b83979113bc0ea04fdacf7" fallback={"Catering"} /></a>
            <a href="/flavor-archive" className="transition hover:text-[#eb2327]"><ManagedText id="86e4ab5ddb54f9bb320ef4e1" fallback={"Flavor Archive"} /></a>
            <a href="/reviews" className="transition hover:text-[#eb2327]"><ManagedText id="7d28b6689bec577eab106c8f" fallback={"Reviews"} /></a>
            <a href="/careers" className="transition hover:text-[#eb2327]"><ManagedText id="b7ec6498782808daf29486d4" fallback={"Careers"} /></a>
            <a href="/press" className="transition hover:text-[#eb2327]"><ManagedText id="bc286cdf9c4d5d0b1e5d6568" fallback={"Press"} /></a>
            <a href="/allergy-notice" className="transition hover:text-[#eb2327]"><ManagedText id="31db4bfede43c44c64c2cdd8" fallback={"Allergy Notice"} /></a>
            <a href="/#faq" className="transition hover:text-[#eb2327]"><ManagedText id="05cb8335980001d696d9d004" fallback={"FAQ"} /></a>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.25em] text-[#eb2327]"><ManagedText id="39a5a7e6cd70d5c09b2ee2a0" fallback={"Legal"} /></h3>

          <div className="mt-6 flex flex-col gap-4">
            <a href="/privacy" className="transition hover:text-[#eb2327]"><ManagedText id="ab25786f9749fa0271b289a1" fallback={"Privacy"} /></a>
            <a href="/terms" className="transition hover:text-[#eb2327]"><ManagedText id="0cc3d427ee5345861d7bc19a" fallback={"Terms"} /></a>
            <a href="/shipping" className="transition hover:text-[#eb2327]"><ManagedText id="1f278a971c414d3d2ba7085a" fallback={"Shipping"} /></a>
            <a href="/refunds" className="transition hover:text-[#eb2327]"><ManagedText id="d2af61edc4d46c2172adf354" fallback={"Refunds"} /></a>
            <a
              href="/intellectual-property"
              className="transition hover:text-[#eb2327]"
            ><ManagedText id="2cda15fc21e670a4fde38015" fallback={"Intellectual Property"} /></a>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.25em] text-[#eb2327]"><ManagedText id="7fde6286929aa1261fcc3ab3" fallback={"Social"} /></h3>

          <div className="mt-6 flex flex-col gap-4">
            <a href="#" className="transition hover:text-[#eb2327]"><ManagedText id="4db2986e03f960820fd68a98" fallback={"Instagram"} /></a>
            <a href="#" className="transition hover:text-[#eb2327]"><ManagedText id="803427bd0a2eaa88321ab767" fallback={"TikTok"} /></a>
            <a href="#" className="transition hover:text-[#eb2327]"><ManagedText id="81ddd509b3fff91bdd6170cd" fallback={"Contact"} /></a>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-16 flex max-w-7xl flex-col items-center justify-between gap-5 border-t border-[#ffe3f3] pt-8 text-sm text-[#6f4b3e] md:flex-row">
        <p><ManagedText id="8a5ca9eb00df06c750b7d668" fallback={"© 2025 Chunki Chip. All rights reserved."} /></p>
        <p><ManagedText id="2aaeb8a0aff16014a58ba9dc" fallback={"Fresh baked daily. Shipped nationwide."} /></p>
      </div>
    </footer>
  );
}
