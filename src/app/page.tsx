'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Footer from '@/components/Footer';

type Product = {
  id: string;
  name: string;
  description: string;
  kitchenName: string;
  imageId: string | null;
  imageUrl: string | null;
  variationId: string | null;
  priceAmount: string;
  price: string;
  isBox: boolean;
  boxSize: string | null;
};

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts() {
    const res = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/api/products`
);

      const data = await res.json();

      setProducts(
        Array.isArray(data) ? data : []
      );
    }

    loadProducts();
  }, []);

  const boxes = products.filter(
    (product) => product.isBox
  );

  const cookies = products.filter(
    (product) => !product.isBox
  );

  const featuredCookie = cookies[0];

  return (
    <main className="overflow-hidden bg-[#fff7f9] text-[#2b140d]">
      <section
        className="
          relative
          overflow-hidden
          px-6
          pb-24
          pt-36
          md:px-10
          md:pb-32
          md:pt-44
        "
      >
        <div
          className="
            absolute
            left-[-120px]
            top-[-120px]
            h-[320px]
            w-[320px]
            rounded-full
            bg-pink-200
            blur-3xl
          "
        />

        <div
          className="
            absolute
            bottom-[-120px]
            right-[-120px]
            h-[320px]
            w-[320px]
            rounded-full
            bg-red-200
            blur-3xl
          "
        />

        <div
          className="
            relative
            mx-auto
            grid
            max-w-7xl
            items-center
            gap-16
            md:grid-cols-2
          "
        >
          <div>
            <div
              className="
                inline-flex
                items-center
                rounded-full
                bg-white
                px-4
                py-2
                text-sm
                font-black
                text-[#ff2626]
                shadow-lg
              "
            >
              🍪 Fresh Baked Daily
            </div>

            <h1
  className="
    brand-heading
    mt-6
    text-6xl
    uppercase
    leading-[0.95]
    tracking-[-0.04em]
    text-[#eb2327]
    md:text-[8rem]
  "
>
              BIG
              <br />
              COOKIE
              <br />
              ENERGY
            </h1>

            <p
              className="
                mt-8
                max-w-xl
                text-lg
                leading-8
                text-[#6f4b3e]
                md:text-xl
              "
            >
              Giant gourmet cookies, custom
              cookie boxes, and weekly drops
              built to feel like your favorite
              streetwear launch.
            </p>

            <div
              className="
                mt-10
                flex
                flex-wrap
                gap-4
              "
            >
              <a
                href="#cookies"
                className="
                  rounded-full
                  bg-[#ff2626]
                  px-8
                  py-4
                  text-lg
                  font-black
                  text-white
                  shadow-xl
                  transition
                  hover:scale-105
                "
              >
                Order Cookies
              </a>

              <a
                href="#boxes"
                className="
                  rounded-full
                  bg-white
                  px-8
                  py-4
                  text-lg
                  font-black
                  text-[#2b140d]
                  shadow-xl
                  transition
                  hover:scale-105
                "
              >
                Build A Box
              </a>
            </div>
          </div>

          <div
            className="
              relative
              flex
              items-center
              justify-center
            "
          >
            <div
              className="
                absolute
                h-[420px]
                w-[420px]
                rounded-full
                bg-white
                blur-2xl
              "
            />

            {featuredCookie?.imageUrl ? (
              <img
                src={featuredCookie.imageUrl}
                alt={featuredCookie.name}
                className="
                  relative
                  z-10
                  w-full
                  max-w-[520px]
                  rotate-[-8deg]
                  drop-shadow-[0_30px_60px_rgba(0,0,0,0.2)]
                  transition
                  duration-500
                  hover:rotate-0
                  hover:scale-105
                "
              />
            ) : (
              <div className="text-[14rem]">
                🍪
              </div>
            )}
          </div>
        </div>
      </section>

{/* COOKIE DROP */}
<section className="overflow-hidden border-t border-[#ffe3f3] bg-[#fff8fc] px-6 py-20 md:px-10">
  <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2">
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#eb2327]">
        This Week’s Drop
      </p>

      <h2 className="brand-heading mt-4 text-6xl leading-none text-[#2b140d] md:text-7xl">
        BISCOFF
        <br />
        OVERLOAD
      </h2>

      <p className="mt-6 max-w-xl text-lg leading-8 text-[#6f4b3e]">
        Loaded with melted Biscoff spread, white chocolate chunks, and crushed
        Lotus biscuits on top.
      </p>

      <a
        href="#cookies"
        className="mt-8 inline-flex h-[52px] items-center rounded-full bg-black px-8 text-base font-semibold text-white transition hover:scale-[1.02]"
      >
        Order This Drop
      </a>
    </div>

    <div className="relative flex items-center justify-center">
      <div className="absolute h-[420px] w-[420px] rounded-full bg-[#ffe7f4]" />

      <img
        src="/cookies/biscoff.png"
        alt="Biscoff Cookie"
        className="relative z-10 w-full max-w-[500px] rotate-[-8deg] drop-shadow-[0_30px_60px_rgba(0,0,0,0.18)] transition duration-500 hover:rotate-[-4deg] hover:scale-105"
      />
    </div>
  </div>
</section>

{/* REWARDS */}
<section className="overflow-hidden border-t border-[#ffe3f3] bg-white px-6 py-20 md:px-10">
  <div className="mx-auto grid max-w-7xl items-center gap-14 md:grid-cols-2">
    {/* LEFT */}
    <div>
      <p className="text-sm font-black uppercase tracking-[0.3em] text-[#eb2327]">
        Chunki Rewards
      </p>

      <h2 className="brand-heading mt-4 text-6xl leading-none text-[#2b140d] md:text-7xl">
        EARN
        <br />
        FREE
        <br />
        COOKIES
      </h2>

      <p className="mt-6 max-w-xl text-lg leading-8 text-[#6f4b3e]">
        Earn points on every order, unlock birthday rewards, and get exclusive
        access to new cookie drops before anyone else.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <div className="rounded-full border border-[#ffccef] bg-[#fff7fb] px-5 py-3 text-sm font-semibold text-[#eb2327]">
          1 Point Per $1
        </div>

        <div className="rounded-full border border-[#ffccef] bg-[#fff7fb] px-5 py-3 text-sm font-semibold text-[#eb2327]">
          Birthday Cookies
        </div>

        <div className="rounded-full border border-[#ffccef] bg-[#fff7fb] px-5 py-3 text-sm font-semibold text-[#eb2327]">
          Exclusive Drops
        </div>
      </div>

      <button
        className="mt-10 inline-flex h-[54px] items-center justify-center rounded-full bg-black px-8 text-base font-semibold text-white transition hover:scale-[1.02]"
      >
        Join Rewards
      </button>
    </div>

    {/* RIGHT */}
    <div className="relative flex items-center justify-center">
      <div className="absolute h-[440px] w-[440px] rounded-full bg-[#ffe7f4]" />

      <div className="relative z-10 w-full max-w-[520px] rounded-[3rem] border border-[#ffe3f3] bg-white p-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#eb2327]">
              Rewards Balance
            </p>

            <h3 className="brand-heading mt-3 text-6xl">
              248
            </h3>
          </div>

          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#fff7fb]">
            <img
              src="/logo.png"
              alt="Rewards"
              className="h-[80%] w-[80%] object-contain"
            />
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-full bg-[#fff1f7]">
          <div className="h-4 w-[72%] rounded-full bg-[#eb2327]" />
        </div>

        <div className="mt-4 flex items-center justify-between text-sm font-medium text-[#6f4b3e]">
          <span>248 points</span>

          <span>350 = Free Box</span>
        </div>

        <div className="mt-10 rounded-[2rem] bg-[#fff7fb] p-5">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#eb2327]">
            Next Reward
          </p>

          <h4 className="brand-heading mt-3 text-4xl">
            FREE COOKIE
          </h4>

          <p className="mt-3 text-sm leading-7 text-[#6f4b3e]">
            Only 102 more points until your next reward unlocks.
          </p>
        </div>
      </div>
    </div>
  </div>
</section>

	{/* REVIEWS */}
<section className="overflow-hidden border-t border-[#ffe3f3] bg-[#fff8fc] px-6 py-20 md:px-10">
  <div className="mx-auto max-w-7xl">
    <div className="mb-14 text-center">
      <p className="text-sm font-black uppercase tracking-[0.3em] text-[#eb2327]">
        Cookie Reviews
      </p>

      <h2 className="brand-heading mt-4 text-6xl leading-none text-[#2b140d] md:text-7xl">
        PEOPLE
        <br />
        ARE OBSESSED
      </h2>

      <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#6f4b3e]">
        The internet has a lot to say about Chunki Chip.
      </p>
    </div>

    <div className="grid gap-6 md:grid-cols-3">
      {/* REVIEW 1 */}
      <div className="rounded-[2.5rem] border border-[#ffe3f3] bg-white p-8 shadow-xl transition hover:-translate-y-2">
        <div className="flex gap-1 text-2xl">
          ⭐⭐⭐⭐⭐
        </div>

        <p className="mt-6 text-xl font-semibold leading-9 text-[#2b140d]">
          “These are genuinely the best cookies I’ve ever had.”
        </p>

        <div className="mt-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fff1f7] text-xl font-black text-[#eb2327]">
            A
          </div>

          <div>
            <p className="font-semibold text-[#2b140d]">
              Ava R.
            </p>

            <p className="text-sm text-[#6f4b3e]">
              Verified Customer
            </p>
          </div>
        </div>
      </div>

      {/* REVIEW 2 */}
      <div className="rounded-[2.5rem] border border-[#ffe3f3] bg-[#eb2327] p-8 text-white shadow-2xl transition hover:-translate-y-2">
        <div className="flex gap-1 text-2xl">
          ⭐⭐⭐⭐⭐
        </div>

        <p className="mt-6 text-xl font-semibold leading-9">
          “The Biscoff one changed my life.”
        </p>

        <div className="mt-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-xl font-black">
            J
          </div>

          <div>
            <p className="font-semibold">
              Jordan K.
            </p>

            <p className="text-sm text-white/70">
              Verified Customer
            </p>
          </div>
        </div>
      </div>

      {/* REVIEW 3 */}
      <div className="rounded-[2.5rem] border border-[#ffe3f3] bg-white p-8 shadow-xl transition hover:-translate-y-2">
        <div className="flex gap-1 text-2xl">
          ⭐⭐⭐⭐⭐
        </div>

        <p className="mt-6 text-xl font-semibold leading-9 text-[#2b140d]">
          “Dangerously good. Ordered once and now I’m addicted.”
        </p>

        <div className="mt-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fff1f7] text-xl font-black text-[#eb2327]">
            M
          </div>

          <div>
            <p className="font-semibold text-[#2b140d]">
              Maya T.
            </p>

            <p className="text-sm text-[#6f4b3e]">
              Verified Customer
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

{/* COOKIE COLLAGE */}
<section className="relative overflow-hidden border-t border-[#ffe3f3] bg-white px-6 py-28 md:px-10">
  <div className="absolute left-[-120px] top-[-120px] h-[320px] w-[320px] rounded-full bg-pink-100 blur-3xl" />

  <div className="absolute bottom-[-140px] right-[-140px] h-[340px] w-[340px] rounded-full bg-red-100 blur-3xl" />

  <div className="relative mx-auto max-w-7xl">
    <div className="text-center">
      <p className="text-sm font-black uppercase tracking-[0.3em] text-[#eb2327]">
        Fresh Every Day
      </p>

      <h2 className="brand-heading mt-5 text-6xl leading-none text-[#2b140d] md:text-8xl">
        BAKED
        <br />
        DIFFERENT
      </h2>

      <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-[#6f4b3e]">
        Thick cookies. Melted centers. Fresh ingredients. Built for cravings.
      </p>
    </div>

    <div className="relative mx-auto mt-24 flex min-h-[650px] max-w-6xl items-center justify-center">
      {/* CENTER */}
      <img
        src="/cookies/biscoff.png"
        alt="Cookie"
        className="absolute z-20 w-[340px] rotate-[-6deg] drop-shadow-[0_40px_60px_rgba(0,0,0,0.22)] transition duration-500 hover:scale-105 hover:rotate-[-2deg]"
      />

      {/* LEFT */}
      <img
        src="/cookies/chocochip.png"
        alt="Cookie"
        className="absolute left-[4%] top-[14%] z-10 w-[250px] rotate-[-18deg] opacity-95 drop-shadow-[0_30px_50px_rgba(0,0,0,0.18)] transition duration-500 hover:scale-105"
      />

      {/* RIGHT */}
      <img
        src="/cookies/redvelvet.png"
        alt="Cookie"
        className="absolute right-[6%] top-[8%] z-10 w-[260px] rotate-[14deg] opacity-95 drop-shadow-[0_30px_50px_rgba(0,0,0,0.18)] transition duration-500 hover:scale-105"
      />

      {/* BOTTOM LEFT */}
      <img
        src="/cookies/oreo.png"
        alt="Cookie"
        className="absolute bottom-[4%] left-[18%] z-10 w-[240px] rotate-[12deg] opacity-95 drop-shadow-[0_30px_50px_rgba(0,0,0,0.18)] transition duration-500 hover:scale-105"
      />

      {/* BOTTOM RIGHT */}
      <img
        src="/cookies/smore.png"
        alt="Cookie"
        className="absolute bottom-[2%] right-[16%] z-10 w-[250px] rotate-[-10deg] opacity-95 drop-shadow-[0_30px_50px_rgba(0,0,0,0.18)] transition duration-500 hover:scale-105"
      />
    </div>
  </div>
</section>

{/* SHIPPING + FAQ */}
<section className="border-t border-[#ffe3f3] bg-[#fff8fc] px-6 py-20 md:px-10">
  <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-2">
    {/* SHIPPING */}
    <div>
      <p className="text-sm font-black uppercase tracking-[0.3em] text-[#eb2327]">
        Delivery & Shipping
      </p>

      <h2 className="brand-heading mt-4 text-6xl leading-none text-[#2b140d] md:text-7xl">
        FRESH
        <br />
        TO YOUR
        <br />
        DOOR
      </h2>

      <div className="mt-10 space-y-5">
        <div className="rounded-[2rem] border border-[#ffe3f3] bg-white p-6">
          <h3 className="text-xl font-black text-[#2b140d]">
            Local Delivery
          </h3>

          <p className="mt-3 text-base leading-8 text-[#6f4b3e]">
            Fast local delivery powered through DoorDash.
          </p>
        </div>

        <div className="rounded-[2rem] border border-[#ffe3f3] bg-white p-6">
          <h3 className="text-xl font-black text-[#2b140d]">
            Nationwide Shipping
          </h3>

          <p className="mt-3 text-base leading-8 text-[#6f4b3e]">
            Fresh-packed cookie boxes shipped nationwide across the U.S.
          </p>
        </div>

        <div className="rounded-[2rem] border border-[#ffe3f3] bg-white p-6">
          <h3 className="text-xl font-black text-[#2b140d]">
            Fresh Baked Daily
          </h3>

          <p className="mt-3 text-base leading-8 text-[#6f4b3e]">
            Every cookie is baked fresh in our commercial kitchen before
            delivery or shipment.
          </p>
        </div>
      </div>
    </div>

    {/* FAQ */}
    <div>
      <p className="text-sm font-black uppercase tracking-[0.3em] text-[#eb2327]">
        FAQ
      </p>

      <h2 className="brand-heading mt-4 text-6xl leading-none text-[#2b140d] md:text-7xl">
        GOOD
        <br />
        QUESTIONS
      </h2>

      <div className="mt-10 space-y-4">
        <div className="rounded-[2rem] border border-[#ffe3f3] bg-white p-6">
          <h3 className="text-xl font-black text-[#2b140d]">
            How big are the cookies?
          </h3>

          <p className="mt-3 leading-8 text-[#6f4b3e]">
            Thick, oversized bakery-style cookies packed with fillings and
            toppings.
          </p>
        </div>

        <div className="rounded-[2rem] border border-[#ffe3f3] bg-white p-6">
          <h3 className="text-xl font-black text-[#2b140d]">
            Do flavors rotate?
          </h3>

          <p className="mt-3 leading-8 text-[#6f4b3e]">
            Yes — new weekly drops and limited flavors are released regularly.
          </p>
        </div>

        <div className="rounded-[2rem] border border-[#ffe3f3] bg-white p-6">
          <h3 className="text-xl font-black text-[#2b140d]">
            How should I reheat cookies?
          </h3>

          <p className="mt-3 leading-8 text-[#6f4b3e]">
            Microwave for 10–15 seconds for a warm gooey center.
          </p>
        </div>

        <div className="rounded-[2rem] border border-[#ffe3f3] bg-white p-6">
          <h3 className="text-xl font-black text-[#2b140d]">
            Do you offer catering or large orders?
          </h3>

          <p className="mt-3 leading-8 text-[#6f4b3e]">
            Yes — contact us for parties, events, corporate gifting, and large
            cookie orders.
          </p>
        </div>
      </div>
    </div>
  </div>
</section>

      <section
        id="boxes"
        className="
          rounded-t-[3rem]
          bg-white
          px-6
          py-20
          md:px-10
        "
      >
        <div className="mx-auto max-w-7xl">
          <div
            className="
              mb-10
              flex
              flex-col
              gap-4
              md:flex-row
              md:items-end
              md:justify-between
            "
          >
            <div>
              <p
                className="
                  text-sm
                  font-black
                  uppercase
                  tracking-[0.3em]
                  text-[#ff2626]
                "
              >
                Build Your Own
              </p>

              <h2
  className="
    brand-heading
    mt-2
    text-5xl
    md:text-6xl
  "
>
                Cookie Boxes
              </h2>
            </div>

            <p
              className="
                max-w-md
                text-[#6f4b3e]
              "
            >
              Pick your flavors. Build your
              perfect lineup. Delivered fresh.
            </p>
          </div>

          <div
            className="
              grid
              gap-8
              md:grid-cols-3
            "
          >
            {boxes.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                large
              />
            ))}
          </div>
        </div>
      </section>

      <section
        id="cookies"
        className="
          bg-[#fff7f9]
          px-6
          py-20
          md:px-10
        "
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-10">
            <p
              className="
                text-sm
                font-black
                uppercase
                tracking-[0.3em]
                text-[#ff2626]
              "
            >
              Weekly Drops
            </p>

            <h2
              className="
                mt-2
                text-5xl
                font-black
                md:text-6xl
              "
            >
              Single Cookies
            </h2>
          </div>

          <div
            className="
              grid
              grid-cols-1
              gap-6
              sm:grid-cols-2
              lg:grid-cols-4
            "
          >
            {cookies.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        </div>
            </section>

      <Footer />
    </main>
  );
}

function ProductCard({
  product,
  large = false,
}: {
  product: Product;
  large?: boolean;
}) {
  return (
    <motion.a
      href={`/product/${product.id}`}
      initial={{
  opacity: 0,
  y: 80,
  scale: 0.92,
}}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
      }}
      transition={{
  duration: 0.9,
  ease: [0.22, 1, 0.36, 1],
}}
      className="group overflow-hidden rounded-[2rem] border border-[#ffe3f3] bg-white transition hover:-translate-y-1 hover:shadow-2xl"
    >
      <div
        className={`relative flex items-center justify-center overflow-hidden bg-[#fff7fb] ${
          large ? 'h-[340px]' : 'h-[260px]'
        }`}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="max-h-[82%] object-contain transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="text-8xl">🍪</div>
        )}
      </div>

      <div className="p-6">
        <div className="mb-3 flex items-start justify-between gap-4">
          <h3 className="brand-heading text-3xl leading-none">
            {product.name}
          </h3>

          <span className="rounded-full bg-[#eb2327] px-3 py-1 text-sm font-semibold text-white">
            {product.price}
          </span>
        </div>

        <p className="line-clamp-3 text-sm leading-6 text-[#6f4b3e]">
          {product.description}
        </p>

        <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#eb2327]">
          {product.isBox ? 'Build Box' : 'View Cookie'}

          <span className="transition group-hover:translate-x-1">→</span>
        </div>
      </div>
    </motion.a>
  );
}