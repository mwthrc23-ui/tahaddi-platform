const LOCAL_WEB_ORIGIN = 'http://localhost:3000';

function normalizeHttpOrigin(value: string | undefined) {
  const normalized = value?.trim();
  if (!normalized) return null;

  try {
    const url = new URL(normalized);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

export function isValidWebOriginList(value: string) {
  const origins = value.split(',').map((origin) => origin.trim());
  return (
    origins.length > 0 &&
    origins.every(
      (origin) => Boolean(origin) && normalizeHttpOrigin(origin) !== null,
    )
  );
}

function toHttpsOrigin(hostname: string | undefined) {
  const normalized = hostname?.trim();
  return normalized ? normalizeHttpOrigin(`https://${normalized}`) : null;
}

export function getAllowedWebOrigins() {
  const configuredOrigins = (process.env.WEB_ORIGIN ?? '')
    .split(',')
    .map((origin) => normalizeHttpOrigin(origin))
    .filter((origin): origin is string => Boolean(origin));
  const localDevelopmentOrigin =
    process.env.NODE_ENV === 'production' ? null : LOCAL_WEB_ORIGIN;

  return [
    ...new Set(
      [
        ...configuredOrigins,
        toHttpsOrigin(process.env.VERCEL_URL),
        toHttpsOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL),
        localDevelopmentOrigin,
      ].filter((origin): origin is string => Boolean(origin)),
    ),
  ];
}

export function isAllowedWebSocketOrigin(origin: string | undefined) {
  if (!origin) return process.env.NODE_ENV !== 'production';
  const normalizedOrigin = normalizeHttpOrigin(origin);
  return Boolean(
    normalizedOrigin && getAllowedWebOrigins().includes(normalizedOrigin),
  );
}

export function allowWebSocketOrigin(
  origin: string | undefined,
  callback: (error: Error | null, allowed?: boolean) => void,
) {
  callback(null, isAllowedWebSocketOrigin(origin));
}

export function allowWebSocketRequest(
  request: { headers: { origin?: string | string[] } },
  callback: (error: string | null | undefined, success: boolean) => void,
) {
  const header = request.headers.origin;
  const origin = Array.isArray(header) ? header[0] : header;
  callback(null, isAllowedWebSocketOrigin(origin));
}
