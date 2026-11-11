import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '@fontsource/anton';
import './globals.css';
import { GoogleAnalytics } from '@next/third-parties/google';
import MetaPixel from '@/components/MetaPixel';
import SiteShell from '@/components/SiteShell';
import { ContentProvider } from '@/components/ManagedText';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
metadataBase: new URL('https://chunkichip.com'),
  title: 'Chunki Chip Cookies | Milford, NH',

  description:
    'Fresh baked stuffed cookies, weekly drops, custom cookie boxes, and giant flavors built for cravings.',

  openGraph: {
    title: 'Chunki Chip',

    description:
      'Fresh baked stuffed cookies, weekly drops, and custom cookie boxes.',

    url: 'https://chunkichip.com',

    siteName: 'Chunki Chip',

    images: [
      {
        url: '/hero-customers.webp',
        alt: 'Chunki Chip Cookies',
      },
    ],

    locale: 'en_US',

    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',

    title: 'Chunki Chip',

    description:
      'Fresh baked stuffed cookies and weekly flavor drops.',

    images: ['/hero-customers.webp'],
  },


};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
<ContentProvider><SiteShell>{children}</SiteShell></ContentProvider>
<MetaPixel />
<GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
</body>
    </html>
  );
}
