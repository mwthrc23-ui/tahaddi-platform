import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type VercelConfig = {
  services?: {
    realtime?: {
      entrypoint?: string;
      framework?: string;
    };
  };
  rewrites?: Array<{
    source?: string;
    destination?: {
      service?: string;
    };
  }>;
};

describe('Vercel realtime deployment', () => {
  const config = JSON.parse(
    readFileSync(resolve(__dirname, '../../../vercel.json'), 'utf8'),
  ) as VercelConfig;

  it('traces the NestJS source entrypoint and exposes realtime routes', () => {
    expect(config.services?.realtime).toMatchObject({
      entrypoint: 'src/main.ts',
      framework: 'nestjs',
    });
    expect(config.rewrites).toEqual(
      expect.arrayContaining([
        {
          source: '/socket.io/(.*)',
          destination: { service: 'realtime' },
        },
        {
          source: '/realtime/(.*)',
          destination: { service: 'realtime' },
        },
      ]),
    );
  });
});
