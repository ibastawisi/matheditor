/** @type {import('next').NextConfig} */

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const withPWA = require("@imbios/next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: ["app-build-manifest.json"],
  skipWaiting: false,
  mode: "production",
  cacheOnFrontEndNav: true,
  reloadOnOnline: false,
  fallbacks: {
    document: "/~offline",
  },
});


const config = {
  webpack: (config, options) => {
    config.module.rules.push({
      test: /\.woff2?(\?v=\d+\.\d+\.\d+)?$/,
      type: "asset/resource",
      parser: { dataUrlCondition: { maxSize: 100000 } },
    })
    return config
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = withBundleAnalyzer(withPWA(config));