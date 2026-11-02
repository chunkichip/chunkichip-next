export default function Footer() {
  return (
    <footer className="border-t border-[#ffe3f3] bg-white px-6 py-16 md:px-10">
      <div className="mx-auto grid max-w-7xl gap-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-[#eb2327] bg-white shadow-lg">
              <img
                src="/logo.png"
                alt="Chunki Chip"
                className="h-[84%] w-[84%] object-contain"
              />
            </div>

            <div>
              <h2 className="brand-heading text-4xl leading-none text-[#2b140d]">
                CHUNKI
              </h2>
              <h2 className="brand-heading text-4xl leading-none text-[#eb2327]">
                CHIP
              </h2>
            </div>
          </div>

          <p className="mt-6 max-w-sm text-base leading-8 text-[#6f4b3e]">
            Thick stuffed cookies, weekly flavor drops, and fresh baked boxes
            shipped nationwide.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.25em] text-[#eb2327]">
            Explore
          </h3>

          <div className="mt-6 flex flex-col gap-4">
            <a href="/#cookies" className="transition hover:text-[#eb2327]">
              Cookies
            </a>
            <a href="/#boxes" className="transition hover:text-[#eb2327]">
              Build A Box
            </a>
            <a href="/catering" className="transition hover:text-[#eb2327]">
              Catering
            </a>
            <a href="/flavor-archive" className="transition hover:text-[#eb2327]">
              Flavor Archive
            </a>
            <a href="/#reviews" className="transition hover:text-[#eb2327]">
              Reviews
            </a>
            <a href="/#faq" className="transition hover:text-[#eb2327]">
              FAQ
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.25em] text-[#eb2327]">
            Legal
          </h3>

          <div className="mt-6 flex flex-col gap-4">
            <a href="/privacy" className="transition hover:text-[#eb2327]">
              Privacy
            </a>
            <a href="/terms" className="transition hover:text-[#eb2327]">
              Terms
            </a>
            <a href="/shipping" className="transition hover:text-[#eb2327]">
              Shipping
            </a>
            <a href="/refunds" className="transition hover:text-[#eb2327]">
              Refunds
            </a>
            <a
              href="/intellectual-property"
              className="transition hover:text-[#eb2327]"
            >
              Intellectual Property
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.25em] text-[#eb2327]">
            Social
          </h3>

          <div className="mt-6 flex flex-col gap-4">
            <a href="#" className="transition hover:text-[#eb2327]">
              Instagram
            </a>
            <a href="#" className="transition hover:text-[#eb2327]">
              TikTok
            </a>
            <a href="#" className="transition hover:text-[#eb2327]">
              Contact
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-16 flex max-w-7xl flex-col items-center justify-between gap-5 border-t border-[#ffe3f3] pt-8 text-sm text-[#6f4b3e] md:flex-row">
        <p>© 2025 Chunki Chip. All rights reserved.</p>
        <p>Fresh baked daily. Shipped nationwide.</p>
      </div>
    </footer>
  );
}