import type { NextConfig } from 'next'
import withBundleAnalyzer from '@next/bundle-analyzer'
import withPWA from './next-pwa'
import { existsSync, readFileSync } from 'fs'

// Vercel provides the commit SHA; elsewhere (Dokploy) read it from .git without needing the git binary
function readGitCommitSha() {
  try {
    const head = readFileSync('.git/HEAD', 'utf8').trim();
    if (!head.startsWith('ref: ')) return head;
    const ref = head.slice(5);
    if (existsSync(`.git/${ref}`)) return readFileSync(`.git/${ref}`, 'utf8').trim();
    const packed = readFileSync('.git/packed-refs', 'utf8');
    return packed.split('\n').find(line => line.endsWith(` ${ref}`))?.split(' ')[0];
  } catch {
    return undefined;
  }
}

const COMMIT_SHA = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || readGitCommitSha();

const IS_VERCEL = !!process.env.NEXT_PUBLIC_VERCEL_URL;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const withBundleAnalyzerConfig = {
  enabled: process.env.ANALYZE === 'true',
};

const withPWAConfig = {
  dest: "public",
  disable: !IS_PRODUCTION,
  register: false,
  buildExcludes: ["app-build-manifest.json"],
  skipWaiting: false,
  cacheStartUrl: false,
  dynamicStartUrl: false,
  reloadOnOnline: false,
  fallbacks: {
    document: "/offline",
  },
};

const nextConfig: NextConfig = {
  reactStrictMode: false,
  distDir: process.env.BUILD_DIR || '.next',
  env: COMMIT_SHA ? { NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA: COMMIT_SHA } : {},
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('canvas');
    }
    if (IS_VERCEL) {
      config.externals.push('puppeteer');
    }
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/i,
      type: "asset/resource",
      resourceQuery: /url/,
    });
    return config
  },
  async headers() {
    return [
      {
        source: "/(.*)\.woff2",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ]
      }
    ]
  }
};

export default withBundleAnalyzer(withBundleAnalyzerConfig)(withPWA(withPWAConfig)(nextConfig));