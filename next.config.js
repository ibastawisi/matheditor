/** @type {import('next').NextConfig} */

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const withPWA = require("./next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === 'development',
  register: false,
  buildExcludes: ["app-build-manifest.json"],
  skipWaiting: false,
  cacheStartUrl: false,
  dynamicStartUrl: false,
  reloadOnOnline: false,
});


const config = {
  reactStrictMode: false,
  webpack: (config, options) => {
    config.module.rules.push({
      test: /\.woff2?(\?v=\d+\.\d+\.\d+)?$/,
      type: "asset/resource",
      parser: { dataUrlCondition: { maxSize: 100000 } },
    })
    return config
  },
  async rewrites() {
    return [
      {
        source: '/new/:path*',
        destination: '/new',
      },
      {
        source: '/edit/:path*',
        destination: '/edit',
      },
    ]
  },
};

module.exports = withPWA(withBundleAnalyzer(config));