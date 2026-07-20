import { APP_CONFIG } from '@tahaddi/config';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: APP_CONFIG.name,
  description: APP_CONFIG.slogan,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={APP_CONFIG.defaultLocale} dir={APP_CONFIG.direction}>
      <body>{children}</body>
    </html>
  );
}
