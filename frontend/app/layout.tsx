import type { Metadata } from 'next';
import './globals.css';
import './mobile-fixes.css';
import './navigation-performance.css';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNavigation } from '@/components/layout/MobileNavigation';
import { RequestCacheBootstrap } from '@/components/performance/RequestCacheBootstrap';

export const metadata: Metadata = {
  title: 'THE SOCIAL SCENE | Sunset Runs · Rooftop Gigs · Outdoor Treks',
  description: 'Curated social experiences — sunset run clubs, rooftop acoustic gigs, mountain treks, and secret supper clubs. Come Solo. Leave With Stories.',
  icons: {
    icon: [
      { url: '/logo-transparent.png', type: 'image/png' },
    ],
    apple: '/logo-transparent.png',
    shortcut: '/logo-transparent.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@300;400;500;600;700&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,700;1,400&family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full antialiased" style={{ backgroundColor: '#ede4d0', color: '#1e1a14' }} suppressHydrationWarning>
        <RequestCacheBootstrap />
        <Navbar />
        {children}
        <MobileNavigation />
      </body>
    </html>
  );
}
