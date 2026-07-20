import path from 'node:path';
import type { NextConfig } from 'next';

const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';

const nextConfig: NextConfig = {
  output: 'export',
  allowedDevOrigins: ['127.0.0.1'],
  trailingSlash: true,
  basePath: isGitHubPages ? '/tahaddi-platform' : '',
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: path.resolve(process.cwd(), '../..'),
  },
};

export default nextConfig;
