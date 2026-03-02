import type { Metadata } from 'next';
import { Cormorant_Garamond, Libre_Baskerville, Special_Elite } from 'next/font/google';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-headline',
  display: 'swap',
});

const baskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-body',
  display: 'swap',
});

const specialElite = Special_Elite({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-meta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'YouTube to Text — Read, Don\u2019t Watch',
    template: '%s — YouTube to Text',
  },
  description:
    'Read YouTube video transcripts. Cleaned up, structured, and searchable.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  ),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'YouTube to Text',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${baskerville.variable} ${specialElite.variable}`}
    >
      <head>
        {/* UnifrakturMaguntia — not available in next/font, loaded via Google Fonts */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="mx-auto max-w-[960px] px-4">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
