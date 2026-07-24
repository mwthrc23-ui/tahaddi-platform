const LOCAL_WEB_ORIGIN = 'http://localhost:3000';

function toHttpsOrigin(hostname: string | undefined) {
  const normalized = hostname?.trim();
  return normalized ? `https://${normalized}` : null;
}

export function getAllowedWebOrigins() {
  const configuredOrigins = (process.env.WEB_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [
    ...new Set(
      [
        ...configuredOrigins,
        toHttpsOrigin(process.env.VERCEL_URL),
        toHttpsOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL),
        LOCAL_WEB_ORIGIN,
      ].filter((origin): origin is string => Boolean(origin)),
    ),
  ];
}
