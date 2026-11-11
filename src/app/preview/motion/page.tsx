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
  const products = await getPublicCatalog() || [];
  // Include unavailable flavors in the display while preserving their Square status.
  const modifiers = new Map(products.flatMap(product => product.modifierSets?.flatMap(set => set.modifiers) || []).map(modifier => [modifier.id, modifier]));
  const flavors = getWeeklyFlavors(products.map(product => ({
    ...product,
    modifierSets: product.modifierSets?.map(set => ({
      ...set, modifiers: set.modifiers.map(modifier => ({ ...modifier, soldOut: false })),
    })),
  }))).map(flavor => ({ ...flavor, soldOut: Boolean(modifiers.get(flavor.id)?.soldOut) }));
  return <MotionPreview flavors={flavors} />;
}
