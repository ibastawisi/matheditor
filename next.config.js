/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.NODE_ENV === "production"
})

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

module.exports = withBundleAnalyzer(config);