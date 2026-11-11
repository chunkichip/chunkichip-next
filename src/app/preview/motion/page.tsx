import type { Metadata } from 'next';
import { getPublicCatalog } from '@/lib/seo-catalog';
import { getWeeklyFlavors } from '@/lib/catalog';
import MotionPreview from './MotionPreview';

export const metadata: Metadata = {
  title: 'Motion design preview | Chunki Chip',
  robots: { index: false, follow: false },
};
export const revalidate = 300;

export default async function Page() {
  const products = await getPublicCatalog();
  return <MotionPreview flavors={getWeeklyFlavors(products || [])} />;
}
