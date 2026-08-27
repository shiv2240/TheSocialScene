import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dashboard Portal | The Social Scene',
  description: 'Operations, Event Management, QR Check-in & Analytics Dashboard for The Social Scene',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full dark" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-[#0b0f19] text-gray-100 antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
