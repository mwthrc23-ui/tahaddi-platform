import { APP_CONFIG } from '@tahaddi/config';
import type { Metadata } from 'next';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

const arabicFont = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-arabic',
});

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
    <html lang={APP_CONFIG.defaultLocale} dir={APP_CONFIG.direction} data-theme="dark" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('tahaddi-theme')||'dark';var d=t==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;document.documentElement.dataset.theme=d;document.documentElement.style.colorScheme=d}catch(e){}})()` }} /></head>
      <body className={arabicFont.variable}><ThemeProvider>{children}</ThemeProvider></body>
    </html>
  );
}
