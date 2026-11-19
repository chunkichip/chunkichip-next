// Use the storefront's active-menu selection instead of the historical archive.
export { getWeeklyFlavors, isInPersonCookieBox } from '../../src/lib/catalog.ts';
import type { CatalogFlavorProduct } from '../../src/lib/catalog.ts';

export type Product = CatalogFlavorProduct & {
  price?: string;
  priceAmount?: number;
  variationId?: string | null;
  boxSize?: string | null;
};

export function readProducts(value: unknown): Product[] {
  if (!Array.isArray(value) || !value.every(item => item && typeof item.id === 'string' && typeof item.name === 'string')) {
    throw new Error('The menu could not be loaded. Please try again.');
  }
  return value as Product[];
}

export const SITE = 'https://chunkichip.com';
export function storefrontUrl(path: string): string {
  const url = new URL(path, SITE);
  if (url.origin !== SITE || !['https:'].includes(url.protocol)) throw new Error('Invalid shop link');
  return url.href;
}
