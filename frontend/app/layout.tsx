import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Social Scene | Curated Social Experiences & Events',
  description: 'Discover sunset run clubs, intimate acoustic rooftop gigs, tech mixers, and outdoor mountain treks in Bengaluru & Delhi NCR. Come Solo. Leave With Stories.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-G4D8JB1ZBW';

  return (
    <html lang="en" className="h-full dark">
      <head>
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
      </head>
      <body className="min-h-full flex flex-col bg-[#141217] text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
