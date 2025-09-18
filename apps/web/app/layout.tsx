import type { Metadata } from 'next';
import { ReactNode } from 'react';

import { Providers } from '@/components/providers';

import './globals.css';

export const metadata: Metadata = {
  title: 'BrainSAIT Digital Insurance Platform',
  description: 'Comprehensive healthcare digitization for Saudi Arabia',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-black text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
