import path from 'node:path';
import type { NextConfig } from 'next';

const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';
const deployTarget = process.env.TAHADDI_DEPLOY_TARGET ?? 'node';
const isStaticExport = deployTarget === 'static';

const nextConfig: NextConfig = {
  output: isStaticExport ? 'export' : undefined,
  allowedDevOrigins: ['127.0.0.1'],
  trailingSlash: true,
  basePath: isStaticExport && isGitHubPages ? '/tahaddi-platform' : '',
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
