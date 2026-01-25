import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { GoogleAdsScript } from '@/components/google-ads';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
});

export const metadata: Metadata = {
  title: 'Fore - Golf Leagues & Scoring Made Simple',
  description:
    'The complete platform for golf courses to manage leagues and outings, and for players to track tournaments with friends. Live scoring and automatic leaderboards.',
  keywords: ['golf', 'golf league', 'golf outing', 'golf tournament', 'golf scoring', 'leaderboard', 'skins', 'nassau'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Fore',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#006747',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} antialiased bg-[#002418] text-[#e8f5f0]`}>
        {children}
        <GoogleAdsScript />
      </body>
    </html>
  );
}
