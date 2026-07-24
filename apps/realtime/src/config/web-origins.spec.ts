import { getAllowedWebOrigins } from './web-origins.js';

describe('getAllowedWebOrigins', () => {
  const originalEnvironment = process.env;

  beforeEach(() => {
    process.env = { ...originalEnvironment };
    delete process.env.WEB_ORIGIN;
    delete process.env.VERCEL_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
  });

  afterAll(() => {
    process.env = originalEnvironment;
  });

  it('allows local development by default', () => {
    expect(getAllowedWebOrigins()).toEqual(['http://localhost:3000']);
  });

  it('includes configured, preview, and production origins without duplicates', () => {
    process.env.WEB_ORIGIN =
      'https://play.example.com, https://admin.example.com';
    process.env.VERCEL_URL = 'preview.example.vercel.app';
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'play.example.com';

    expect(getAllowedWebOrigins()).toEqual([
      'https://play.example.com',
      'https://admin.example.com',
      'https://preview.example.vercel.app',
      'http://localhost:3000',
    ]);
  });
});
