import type { Metadata } from 'next';
import GiftCards from './GiftCards';
export const metadata: Metadata = {
  title: 'Chunki Chip Gift Cards',
  description: 'Send a Chunki Chip eGift card or check your existing gift card balance.',
  alternates: { canonical: '/gift-cards' },
};
export default function Page() { return <GiftCards />; }
