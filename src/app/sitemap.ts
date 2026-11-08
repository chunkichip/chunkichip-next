import type { MetadataRoute } from 'next';
import {catalogPages,getPublicCatalog} from '@/lib/seo-catalog';
export const dynamic = 'force-dynamic';
const base='https://chunkichip.com';
export default async function sitemap():Promise<MetadataRoute.Sitemap> {
  const paths=['','/rewards','/gift-cards','/flavor-archive','/catering','/careers','/press','/reviews','/contact','/faq','/allergy-notice','/intellectual-property','/privacy','/terms','/shipping','/refunds'];
  const catalog=await getPublicCatalog();
  if(catalog) paths.push(...catalogPages(catalog).map(p=>`/product/${encodeURIComponent(p.id)}`));
  return [...new Set(paths)].map(path=>({url:`${base}${path}`}));
}
