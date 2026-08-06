import { APP_CONFIG } from '@tahaddi/config';
import type { Metadata } from 'next';
import { Readex_Pro } from 'next/font/google';
import Script from 'next/script';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ThemeProvider } from '@/components/theme-provider';
import { SHARE_IMAGE, SHARE_IMAGE_URL, SITE_URL } from '@/lib/metadata/site';
import './globals.css';
import '../styles/prestige.css';
import '../styles/game-catalog.css';
import '../styles/mafia-enhanced.css';

const arabicFont = Readex_Pro({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-arabic',
});

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: `${APP_CONFIG.name} | مسابقات عربية مباشرة`,
  description: 'أنشئ مسابقات عربية تفاعلية، شارك رمز الغرفة، وتابع النتائج والترتيب لحظة بلحظة.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: `${APP_CONFIG.name} | مسابقات عربية مباشرة`,
    description: 'سؤال يشعل الحماس، وترتيب يصنع الصدارة في تجربة مسابقات عربية مباشرة.',
    url: '/',
    siteName: APP_CONFIG.name,
    locale: 'ar_SA',
    type: 'website',
    images: [SHARE_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_CONFIG.name} | مسابقات عربية مباشرة`,
    description: 'سؤال يشعل الحماس، وترتيب يصنع الصدارة.',
    images: [SHARE_IMAGE_URL],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={APP_CONFIG.defaultLocale}
      dir={APP_CONFIG.direction}
      data-theme="dark"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem('tahaddi-theme')||'dark';var d=t==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;document.documentElement.dataset.theme=d;document.documentElement.style.colorScheme=d}catch(e){}})()`}
        </Script>
      </head>
      <body className={arabicFont.variable}>
        <ThemeProvider>{children}</ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
