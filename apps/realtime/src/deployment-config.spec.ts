import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type VercelConfig = {
  services?: {
    realtime?: {
      root?: string;
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

type PackageJson = {
  dependencies?: Record<string, string>;
};

describe('Vercel realtime deployment', () => {
  const config = JSON.parse(
    readFileSync(resolve(__dirname, '../../../vercel.json'), 'utf8'),
  ) as VercelConfig;
  const rootPackage = JSON.parse(
    readFileSync(resolve(__dirname, '../../../package.json'), 'utf8'),
  ) as PackageJson;

  it('traces the NestJS source entrypoint and exposes realtime routes', () => {
    expect(config.services?.realtime).toMatchObject({
      root: '.',
      entrypoint: 'apps/realtime/src/main.ts',
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

  it('keeps realtime runtime dependencies visible to the Vercel function packager', () => {
    const dependencies = rootPackage.dependencies ?? {};
    const runtimePackages = [
      '@nestjs/core',
      '@nestjs/common',
      '@nestjs/platform-socket.io',
      '@nestjs/websockets',
      'ioredis',
      'socket.io',
      'zod',
    ];

    for (const packageName of runtimePackages) {
      expect(dependencies[packageName]).toEqual(expect.any(String));
    }

    expect(dependencies['@tahaddi/contracts']).toBe('workspace:*');
    expect(dependencies['@tahaddi/database']).toBe('workspace:*');
    expect(dependencies['@tahaddi/domain']).toBe('workspace:*');
  });
});
