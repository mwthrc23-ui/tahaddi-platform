import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  trailingSlash: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: path.resolve(process.cwd(), '../..'),
  },
};

export default nextConfig;
