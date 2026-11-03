import type { MetadataRoute } from 'next';

const base = 'https://chunkichip.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    '', '/flavor-archive', '/catering', '/careers', '/press', '/reviews',
    '/faq', '/allergy-notice', '/intellectual-property', '/privacy', '/terms', '/shipping', '/refunds',
  ].map((path) => ({ url: `${base}${path}`, changeFrequency: 'weekly', priority: path ? 0.6 : 1 }));
}
