import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '@fontsource/anton';
import './globals.css';
import { GoogleAnalytics } from '@next/third-parties/google';
import MetaPixel from '@/components/MetaPixel';
import SiteShell from '@/components/SiteShell';

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
  title: 'Chunki Chip — Thick Chunki Cookies',

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
        url: '/og-image.png',
        width: 1200,
        height: 630,
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

    images: ['/og-image.png'],
  },

  icons: {
    icon: '/favicon.ico',
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
<SiteShell>{children}</SiteShell>
<MetaPixel />
<GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
</body>
    </html>
  );
}
