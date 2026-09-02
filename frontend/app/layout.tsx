import type { Metadata } from 'next';
import { Bebas_Neue, IBM_Plex_Mono, Oswald, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import './mobile-fixes.css';
import './navigation-performance.css';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNavigation } from '@/components/layout/MobileNavigation';
import { RequestCacheBootstrap } from '@/components/performance/RequestCacheBootstrap';

const displayFont = Bebas_Neue({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

const subFont = Oswald({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-sub',
});

const monoFont = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-mono',
});

const bodyFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'THE SOCIAL SCENE | Sunset Runs · Rooftop Gigs · Outdoor Treks',
  description: 'Curated social experiences — sunset run clubs, rooftop acoustic gigs, mountain treks, and secret supper clubs. Come Solo. Leave With Stories.',
  icons: {
    icon: [{ url: '/logo-transparent.png', type: 'image/png' }],
    apple: '/logo-transparent.png',
    shortcut: '/logo-transparent.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${displayFont.variable} ${subFont.variable} ${monoFont.variable} ${bodyFont.variable} min-h-full antialiased`}
        style={{ backgroundColor: '#ede4d0', color: '#1e1a14' }}
        suppressHydrationWarning
      >
        <RequestCacheBootstrap />
        <Navbar />
        {children}
        <MobileNavigation />
      </body>
    </html>
  );
}
