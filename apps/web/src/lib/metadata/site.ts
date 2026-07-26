import type { Metadata } from 'next';

const FALLBACK_SITE_URL = 'https://tahaddi-platform-realtime.vercel.app';

function resolveSiteUrl() {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    FALLBACK_SITE_URL;
  const withProtocol = /^https?:\/\//i.test(configured) ? configured : `https://${configured}`;

  try {
    return new URL(withProtocol);
  } catch {
    return new URL(FALLBACK_SITE_URL);
  }
}

export const SITE_URL = resolveSiteUrl();
export const SHARE_IMAGE_URL = new URL('/og.png', SITE_URL).toString();

export const SHARE_IMAGE = {
  url: SHARE_IMAGE_URL,
  width: 1200,
  height: 630,
  alt: 'تحدّي — منصة مسابقات عربية مباشرة',
} as const;

function normalizeRoomCode(value?: string) {
  return (
    value
      ?.replace(/[^a-zA-Z0-9\u0660-\u0669]/g, '')
      .slice(0, 8)
      .toUpperCase() ?? ''
  );
}

export function buildJoinMetadata(code?: string): Metadata {
  const roomCode = normalizeRoomCode(code);
  const path = roomCode ? `/join/${encodeURIComponent(roomCode)}` : '/join';
  const title = roomCode ? `انضم إلى غرفة ${roomCode} | تحدّي` : 'انضم إلى مسابقة | تحدّي';
  const description = roomCode
    ? `دعوة مباشرة للانضمام إلى غرفة تحدّي بالرمز ${roomCode}. اكتب اسمك وابدأ اللعب.`
    : 'أدخل رمز الغرفة، اختر اسمك، وانضم مباشرة إلى مسابقة تحدّي.';

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: 'تحدّي',
      locale: 'ar_SA',
      type: 'website',
      images: [SHARE_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [SHARE_IMAGE_URL],
    },
  };
}
