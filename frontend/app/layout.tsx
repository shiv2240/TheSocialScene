import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Social Scene | Curated Social Experiences & Events',
  description: 'Discover sunset run clubs, intimate acoustic rooftop gigs, tech mixers, and curated social experiences in Bengaluru & Delhi NCR.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full dark">
      <body className="min-h-full flex flex-col bg-[#090a0f] text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
