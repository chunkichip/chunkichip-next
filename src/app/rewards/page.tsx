import type { Metadata } from 'next';
import Rewards from './Rewards';
export const metadata: Metadata = {
  title: 'Chunki Chip Rewards',
  description: 'Explore Chunki Chip rewards, check your points, and find your next cookie reward.',
  alternates: { canonical: '/rewards' },
};
export default function Page() { return <Rewards />; }
