'use client';

import { useEffect, useState } from 'react';

export default function DropListPopup() {
  const [open, setOpen] = useState(false);

  const [email, setEmail] = useState('');

  const [loading, setLoading] = useState(false);

  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(
      'drop-list-dismissed'
    );

    if (dismissed) return;

    const timeout = setTimeout(() => {
      setOpen(true);
    }, 8000);

    return () => clearTimeout(timeout);
  }, []);

  function closePopup() {
    sessionStorage.setItem(
      'drop-list-dismissed',
      'true'
    );

    setOpen(false);
  }

  async function handleSubmit() {
    if (!email) return;

    try {
      setLoading(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/customers/subscribe`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setSuccess(true);

        sessionStorage.setItem(
          'drop-list-dismissed',
          'true'
        );

        setTimeout(() => {
          setOpen(false);
        }, 2000);
      } else {
        alert(data.error || 'Failed to subscribe');
      }
    } catch (err) {
      console.error(err);

      alert('Failed to subscribe');
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-[3rem] bg-white shadow-2xl">
        <button
          onClick={closePopup}
          className="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-xl font-semibold text-[#2b140d]"
        >
          ×
        </button>

        <div className="grid md:grid-cols-2">
          {/* LEFT */}
          <div className="relative flex items-center justify-center overflow-hidden bg-[#fff1f7] p-10">
            <div className="absolute h-[320px] w-[320px] rounded-full bg-pink-200 blur-3xl" />

            <img
              src="/cookies/biscoff.png"
              alt="Cookie"
              className="relative z-10 w-full max-w-[320px] rotate-[-8deg] drop-shadow-[0_30px_60px_rgba(0,0,0,0.18)]"
            />
          </div>

          {/* RIGHT */}
          <div className="flex flex-col justify-center p-8 md:p-12">
            {success ? (
              <>
                <p className="text-sm font-black uppercase tracking-[0.3em] text-[#eb2327]">
                  You’re In
                </p>

                <h2 className="brand-heading mt-4 text-5xl leading-none text-[#2b140d] md:text-6xl">
                  WELCOME
                  <br />
                  TO THE
                  <br />
                  DROP LIST
                </h2>

                <p className="mt-6 text-lg leading-8 text-[#6f4b3e]">
                  You’ll now get first access to weekly drops, exclusive
                  flavors, and rewards.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-black uppercase tracking-[0.3em] text-[#eb2327]">
                  Join The Drop List
                </p>

                <h2 className="brand-heading mt-4 text-5xl leading-none text-[#2b140d] md:text-6xl">
                  GET FIRST
                  <br />
                  ACCESS
                </h2>

                <p className="mt-6 text-lg leading-8 text-[#6f4b3e]">
                  Weekly cookie drops, exclusive flavors, early access, and
                  special offers.
                </p>

                <div className="mt-8 flex flex-col gap-3">
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    className="h-[56px] rounded-full border border-[#ffccef] px-6 text-base outline-none transition focus:border-[#eb2327]"
                  />

                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex h-[56px] items-center justify-center rounded-full bg-black text-base font-semibold text-white transition hover:scale-[1.02] disabled:opacity-50"
                  >
                    {loading
                      ? 'Joining...'
                      : 'Get 10% Off'}
                  </button>
                </div>

                <p className="mt-5 text-xs leading-6 text-[#6f4b3e]">
                  By joining, you agree to receive occasional marketing emails
                  and cookie updates.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}