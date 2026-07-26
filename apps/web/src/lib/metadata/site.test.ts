import { describe, expect, it } from 'vitest';
import { buildJoinMetadata, SHARE_IMAGE_URL, SITE_URL } from './site';

describe('share metadata', () => {
  it('uses the production host and the public Open Graph image', () => {
    expect(SITE_URL.origin).toBe('https://tahaddi-platform-realtime.vercel.app');
    expect(SHARE_IMAGE_URL).toBe('https://tahaddi-platform-realtime.vercel.app/og.png');
  });

  it('builds room-specific metadata without exposing malformed code characters', () => {
    const metadata = buildJoinMetadata(' ab-12/? ');

    expect(metadata.title).toBe('انضم إلى غرفة AB12 | تحدّي');
    expect(metadata.alternates?.canonical).toBe('/join/AB12');
    expect(metadata.openGraph?.url).toBe('/join/AB12');
    expect(metadata.openGraph?.images).toEqual([
      expect.objectContaining({
        url: 'https://tahaddi-platform-realtime.vercel.app/og.png',
        width: 1200,
        height: 630,
      }),
    ]);
    expect(metadata.twitter?.images).toEqual([
      'https://tahaddi-platform-realtime.vercel.app/og.png',
    ]);
  });
});
