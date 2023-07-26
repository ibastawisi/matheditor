/** @type {import('next').NextConfig} */

const withPWA = require("@imbios/next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: ["app-build-manifest.json"],
  skipWaiting: false,
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

module.exports = withPWA(config);