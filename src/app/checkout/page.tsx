import type { Metadata } from 'next';
import CookieCheckout from './CookieCheckout';
export const metadata: Metadata = { title: 'Gift Card Checkout | Chunki Chip', robots: { index: false, follow: false }, referrer: 'no-referrer' };
export default function Page() { return <CookieCheckout/>; }
