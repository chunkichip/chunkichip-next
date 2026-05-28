'use client';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const links = [
{
  label: 'Order',
  href: '/#order',
},
  {
    label: 'Build a Box',
    href: '/#build-box',
  },
  {
    label: 'Single Cookies',
    href: '/#single-cookies',
  },
  {
    label: 'Catering',
    href: '/#catering',
  },
  {
    label: 'Rewards',
    href: '/#rewards',
  },
  {
    label: 'Locations',
    href: '/#locations',
  },
  {
    label: 'Contact',
    href: '/#contact',
  },
];

export default function MenuDrawer({
  open,
  setOpen,
}: Props) {
  return (
    <>
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-full max-w-md flex-col overflow-y-auto bg-white transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#ffe3f3] px-6 py-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#eb2327]">
              Chunki Chip
            </p>

            <h2 className="brand-heading mt-1 text-4xl">
              Menu
            </h2>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#ffccef] text-2xl text-[#eb2327]"
          >
            ×
          </button>
        </div>

        <div className="flex min-h-full flex-1 flex-col px-6 py-6">
          <nav className="flex flex-col">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="group flex items-center justify-between border-b border-[#fff1f8] py-5 text-lg font-semibold transition hover:text-[#eb2327]"
              >
                <span>{link.label}</span>

                <span className="translate-x-0 transition group-hover:translate-x-1">
                  →
                </span>
              </a>
            ))}
          </nav>

          <div className="mt-auto rounded-[2rem] bg-[#fff7fb] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#eb2327]">
              Fresh Weekly
            </p>

            <h3 className="brand-heading mt-2 text-4xl leading-none">
              Warm.
              <br />
              Chunky.
              <br />
              Loaded.
            </h3>

            <a
              href="/"
              onClick={() => setOpen(false)}
              className="mt-5 flex h-[52px] items-center justify-center rounded-full bg-black text-sm font-semibold text-white transition hover:scale-[1.02]"
            >
              Order Now
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}