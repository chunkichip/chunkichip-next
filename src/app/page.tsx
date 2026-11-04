import type { Metadata } from 'next';
import HomePage from './HomePage';
const business = {
  "@context": "https://schema.org",
  "@type": [
    "LocalBusiness",
    "Bakery"
  ],
  "name": "Chunki Chip Cookies",
  "image": "https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=9XwM2NlnpkTOzb070nRKxw&cb_client=search.gws-prod.grass&w=211&h=120&yaw=52.269337&pitch=0&thumbfov=100",
  "@id": "https://chunkichip.com/#milford",
  "url": "https://chunkichip.com/",
  "telephone": "+16035548571",
  "hasMap": "https://www.google.com/maps/search/?api=1&query=Chunki+Chip+Cookies%2C+183+Elm+St+Unit+8%2C+Milford+NH+03055&query_place_id=ChIJqYTlQgXL44kRrKF__H_Au4E",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "183 Elm St Unit 8",
    "addressLocality": "Milford",
    "addressRegion": "NH",
    "postalCode": "03055",
    "addressCountry": "US"
  },
  "makesOffer": [
    {
      "@type": "Offer",
      "name": "Cookie shop"
    },
    {
      "@type": "Offer",
      "name": "Bakery"
    },
    {
      "@type": "Offer",
      "name": "Dessert shop"
    }
  ],
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 42.838577199999996,
    "longitude": -71.6650161
  },
  "description": "Fresh-baked cookies in Milford, New Hampshire, with weekly flavors, cookie boxes, catering, and nationwide shipping."
};
export const metadata: Metadata = {
  title: 'Chunki Chip Cookies | Cookie Shop in Milford, NH',
  description: 'Visit Chunki Chip Cookies at 183 Elm St, Unit 8 in Milford, NH. Shop weekly cookie flavors, order pickup, explore catering, or ship a cookie box nationwide.',
  alternates: { canonical: '/' },
  openGraph: { title: 'Chunki Chip Cookies | Milford, NH', description: 'Fresh-baked cookies, weekly flavors, catering, and nationwide shipping from Milford, New Hampshire.', url: 'https://chunkichip.com/', images: [{ url: '/logo.png', alt: 'Chunki Chip Cookies in Milford, NH' }], type: 'website' },
};
export default function Page() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(business).replace(/</g, '\\u003c') }} /><HomePage /></>;
}
