import { APP_CONFIG } from '@tahaddi/config';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} | مسابقات عربية مباشرة`,
  description: 'أنشئ مسابقات عربية تفاعلية، شارك رمز الغرفة، وتابع النتائج والترتيب لحظة بلحظة.',
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
