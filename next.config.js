/** @type {import('next').NextConfig} */

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const withPWA = require("@imbios/next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === 'development',
  register: false,
  buildExcludes: ["app-build-manifest.json"],
  skipWaiting: false,
  mode: "production",
  cacheStartUrl: false,
  dynamicStartUrl: false,
  reloadOnOnline: false,
  fallbacks: {
    document: "/~offline",
  },
  runtimeCaching: require("./cache"),
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
};

module.exports = withPWA(withBundleAnalyzer(config));