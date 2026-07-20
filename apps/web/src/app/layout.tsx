import { APP_CONFIG } from '@tahaddi/config';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://mwthrc23-ui.github.io'),
  title: `${APP_CONFIG.name} | مسابقات عربية مباشرة`,
  description: 'أنشئ مسابقات عربية تفاعلية، شارك رمز الغرفة، وتابع النتائج والترتيب لحظة بلحظة.',
  alternates: {
    canonical: '/tahaddi-platform/',
  },
  openGraph: {
    title: `${APP_CONFIG.name} | مسابقات عربية مباشرة`,
    description: 'سؤال يشعل الحماس، وترتيب يصنع الصدارة في تجربة مسابقات عربية مباشرة.',
    url: '/tahaddi-platform/',
    siteName: APP_CONFIG.name,
    locale: 'ar_SA',
    type: 'website',
    images: [
      {
        url: '/tahaddi-platform/og.png',
        width: 1200,
        height: 630,
        alt: 'تحدّي — منصة مسابقات عربية مباشرة',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_CONFIG.name} | مسابقات عربية مباشرة`,
    description: 'سؤال يشعل الحماس، وترتيب يصنع الصدارة.',
    images: ['/tahaddi-platform/og.png'],
  },
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
