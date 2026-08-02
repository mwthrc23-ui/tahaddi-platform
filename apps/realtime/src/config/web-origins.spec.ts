import {
  allowWebSocketOrigin,
  allowWebSocketRequest,
  getAllowedWebOrigins,
  isAllowedWebSocketOrigin,
} from './web-origins.js';

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

  it('does not expose the local development origin in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.WEB_ORIGIN = 'https://play.example.com';

    expect(getAllowedWebOrigins()).toEqual(['https://play.example.com']);
  });

  it('accepts exact normalized origins and rejects missing or lookalike origins', () => {
    process.env.NODE_ENV = 'production';
    process.env.WEB_ORIGIN = 'https://PLAY.example.com:443/';

    expect(isAllowedWebSocketOrigin('https://play.example.com')).toBe(true);
    expect(isAllowedWebSocketOrigin('https://play.example.com/')).toBe(true);
    expect(isAllowedWebSocketOrigin('https://play.example.com.evil.test')).toBe(
      false,
    );
    expect(isAllowedWebSocketOrigin('*')).toBe(false);
    expect(isAllowedWebSocketOrigin('null')).toBe(false);
    expect(isAllowedWebSocketOrigin(undefined)).toBe(false);
  });

  it('applies the same origin decision to CORS and the Socket.IO handshake', () => {
    process.env.NODE_ENV = 'production';
    process.env.WEB_ORIGIN = 'https://play.example.com';
    const allowed = jest.fn();
    const rejected = jest.fn();

    allowWebSocketOrigin('https://play.example.com', allowed);
    allowWebSocketRequest(
      { headers: { origin: 'https://evil.example.com' } },
      rejected,
    );

    expect(allowed).toHaveBeenCalledWith(null, true);
    expect(rejected).toHaveBeenCalledWith(null, false);
  });
});
