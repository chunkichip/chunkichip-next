'use client';

import { useState, type FormEvent } from 'react';
import CookieSpinner from '@/components/CookieSpinner';
import { ArrowLeft, ArrowRight } from 'lucide-react';

type ShippingItem = {
  variationId: string | null;
  name: string;
  quantity: number;
  selectedFlavors?: { id: string; name?: string }[];
  shippingOnly?: boolean;
};

type ShippingAddress = {
  name: string;
  phone: string;
  street1: string;
  street2: string;
  city: string;
  state: string;
  zip: string;
  country: 'US';
};

type ShippingRate = {
  quoteToken: string;
  carrier: string;
  service: string;
  amountCents: number;
  amount: string;
  estimatedDays: number | null;
  duration: string;
};

const states = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'], ['DC', 'District of Columbia'], ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'], ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
];

const emptyAddress: ShippingAddress = {
  name: '', phone: '', street1: '', street2: '', city: '', state: '', zip: '', country: 'US',
};

const api = (path: string) => `${process.env.NEXT_PUBLIC_API_URL || ''}${path}`;

type Props = {
  items: ShippingItem[];
  locationId?: string;
  onClose: () => void;
};

export default function ShippingCheckout({ items, locationId, onClose }: Props) {
  const [address, setAddress] = useState<ShippingAddress>(emptyAddress);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [error, setError] = useState('');

  function updateAddress(field: keyof ShippingAddress, value: string) {
    setAddress((current) => ({ ...current, [field]: value }));
    setRates([]);
    setSelectedRate(null);
    setError('');
  }

  async function getRates(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoadingRates(true);
    setRates([]);
    setSelectedRate(null);
    setError('');
    try {
      const response = await fetch(api('/api/shipping-rates'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, address, locationId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not get shipping rates.');
      setRates(Array.isArray(result.rates) ? result.rates : []);
      if (!result.rates?.length) setError('No carrier rates came back for this package and address.');
    } catch (rateError) {
      setError(rateError instanceof Error ? rateError.message : 'Could not get shipping rates. Please try again.');
    } finally {
      setLoadingRates(false);
    }
  }

  async function continueToSquare() {
    if (!selectedRate) return;
    setLoadingCheckout(true);
    setError('');
    try {
      const response = await fetch(api('/api/create-checkout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          checkoutMethod: 'shipping',
          deliveryType: 'direct',
          locationId,
          address,
          shippingQuoteToken: selectedRate.quoteToken,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.url) throw new Error(result.error || 'Could not start secure checkout.');
      window.location.assign(result.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Could not start checkout. Please try again.');
      setLoadingCheckout(false);
    }
  }

  const inputClass = 'min-h-12 w-full border-2 border-black bg-white px-3 py-2 text-sm outline-none focus:border-[#eb2327]';

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="shipping-checkout-title">
      <section className="max-h-[96vh] w-full max-w-2xl overflow-y-auto border-2 border-black bg-[#fffafc] p-5 shadow-[8px_8px_0_#eb2327] sm:max-h-[92vh] sm:p-8">
        <div className="flex items-start justify-between gap-4 border-b-2 border-black pb-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[.2em] text-[#eb2327]">Nationwide shipping</p>
            <h2 id="shipping-checkout-title" className="brand-heading mt-2 text-4xl leading-none sm:text-5xl">GET A LIVE RATE</h2>
            <p className="mt-3 max-w-lg text-sm leading-6">Enter the delivery address to compare available carrier services. Square will reopen with this address filled in.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close shipping checkout" className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black bg-white text-2xl">×</button>
        </div>

        <form className="mt-5 grid gap-3 sm:grid-cols-2" onSubmit={getRates}>
          <label className="sm:col-span-2"><span className="mb-1 block text-[11px] font-black uppercase tracking-wider">Recipient name</span><input autoComplete="name" required className={inputClass} value={address.name} onChange={(event) => updateAddress('name', event.target.value)} /></label>
          <label className="sm:col-span-2"><span className="mb-1 block text-[11px] font-black uppercase tracking-wider">Phone</span><input autoComplete="tel" type="tel" required className={inputClass} value={address.phone} onChange={(event) => updateAddress('phone', event.target.value)} /></label>
          <label className="sm:col-span-2"><span className="mb-1 block text-[11px] font-black uppercase tracking-wider">Street address</span><input autoComplete="address-line1" required className={inputClass} value={address.street1} onChange={(event) => updateAddress('street1', event.target.value)} /></label>
          <label className="sm:col-span-2"><span className="mb-1 block text-[11px] font-black uppercase tracking-wider">Apartment, suite, etc. (optional)</span><input autoComplete="address-line2" className={inputClass} value={address.street2} onChange={(event) => updateAddress('street2', event.target.value)} /></label>
          <label><span className="mb-1 block text-[11px] font-black uppercase tracking-wider">City</span><input autoComplete="address-level2" required className={inputClass} value={address.city} onChange={(event) => updateAddress('city', event.target.value)} /></label>
          <label><span className="mb-1 block text-[11px] font-black uppercase tracking-wider">State</span><select autoComplete="address-level1" required className={inputClass} value={address.state} onChange={(event) => updateAddress('state', event.target.value)}><option value="">Choose state</option>{states.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>
          <label><span className="mb-1 block text-[11px] font-black uppercase tracking-wider">ZIP code</span><input autoComplete="postal-code" inputMode="numeric" required maxLength={10} className={inputClass} value={address.zip} onChange={(event) => updateAddress('zip', event.target.value)} /></label>
          <div><span className="mb-1 block text-[11px] font-black uppercase tracking-wider">Country</span><div className={`${inputClass} flex items-center`}>United States</div></div>
          <button type="submit" disabled={loadingRates || loadingCheckout} className="mt-2 flex min-h-14 items-center justify-center gap-2 border-2 border-black bg-[#eb2327] px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-black disabled:cursor-wait disabled:opacity-60 sm:col-span-2">
            {loadingRates ? <><CookieSpinner size={24}/> Checking carriers…</> : <>Show shipping rates <ArrowRight size={18}/></>}
          </button>
        </form>

        {rates.length > 0 && (
          <div className="mt-7 border-t-2 border-black pt-5">
            <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.18em] text-[#eb2327]">Carrier quotes</p><h3 className="brand-heading mt-1 text-3xl">CHOOSE A SERVICE</h3></div><span className="text-xs font-bold">{rates.length} available</span></div>
            <div className="mt-4 grid gap-3">
              {rates.map((rate) => (
                <button type="button" key={rate.quoteToken} onClick={() => setSelectedRate(rate)} className={`flex w-full items-center justify-between gap-4 border-2 border-black p-4 text-left transition ${selectedRate?.quoteToken === rate.quoteToken ? 'bg-[#ffccef] shadow-[4px_4px_0_#eb2327]' : 'bg-white hover:bg-[#fff0f8]'}`}>
                  <span><span className="block font-black">{rate.carrier} · {rate.service}</span><span className="mt-1 block text-xs text-black/70">{rate.estimatedDays ? `Estimated ${rate.estimatedDays} business days` : rate.duration || 'Carrier delivery estimate'}</span></span>
                  <span className="shrink-0 text-lg font-black">{rate.amount}</span>
                </button>
              ))}
            </div>
            {selectedRate && <button type="button" disabled={loadingCheckout} onClick={continueToSquare} className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 border-2 border-black bg-black px-5 py-4 text-sm font-black uppercase tracking-wide text-white transition hover:bg-[#eb2327] disabled:cursor-wait disabled:opacity-60">{loadingCheckout ? <><CookieSpinner size={24}/> Preparing checkout…</> : <>Continue to Square · {selectedRate.amount} shipping <ArrowRight size={18}/></>}</button>}
          </div>
        )}

        {error && <p role="alert" className="mt-5 border-2 border-[#eb2327] bg-white p-4 text-sm font-bold">{error}</p>}
        <button type="button" onClick={onClose} className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.15em]"><ArrowLeft size={15}/> Back to order</button>
      </section>
    </div>
  );
}
