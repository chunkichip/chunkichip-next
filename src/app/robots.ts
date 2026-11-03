import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/admin', '/success', '/cart', '/checkout'] },
    sitemap: 'https://chunkichip.com/sitemap.xml',
  };
}
