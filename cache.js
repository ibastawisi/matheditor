"use strict";

// Workbox RuntimeCaching config: https://developers.google.com/web/tools/workbox/reference-docs/latest/module-workbox-build#.RuntimeCachingEntry
module.exports = [
  {
    urlPattern: ({ url }) => {
      const isSameOrigin = self.origin === url.origin;
      if (!isSameOrigin) return false;
      const pathname = url.pathname;
      // Exclude /api/auth/callback/* to fix OAuth workflow in Safari without impact other environment
      // Above route is default for next-auth, you may need to change it if your OAuth workflow has a different callback route
      // Issue: https://github.com/shadowwalker/next-pwa/issues/131#issuecomment-821894809
      if (pathname.startsWith("/api/auth/callback/")) return false;
      if (pathname.startsWith("/api/")) return true;
      return false;
    },
    handler: "NetworkFirst",
    method: "GET",
    options: {
      cacheName: "apis",
      expiration: {
        maxEntries: 16,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      },
      networkTimeoutSeconds: 10, // fall back to cache if api does not response within 10 seconds
    },
  },
  {
    urlPattern: ({ url }) => {
      const isSameOrigin = self.origin === url.origin;
      if (!isSameOrigin) return false;
      const pathname = url.pathname;
      const searchParams = new URL(url).searchParams;
      if (searchParams.get("_rsc")) return false;
      if (pathname === "/") return true;
      if (pathname === "/playground") return true;
      if (pathname === "/tutorial") return true;
      if (pathname === "/privacy") return true;
      if (pathname === "/dashboard") return true;
      if (pathname === "/new") return true;
      if (pathname === "/edit") return true;
      return false;
    },
    handler: "StaleWhileRevalidate",
    options: {
      cacheName: "pages",
      expiration: {
        maxEntries: 32,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      },
    },
  },
  {
    urlPattern: ({ url }) => {
      const isSameOrigin = self.origin === url.origin;
      if (!isSameOrigin) return false;
      const pathname = url.pathname;
      const searchParams = new URL(url).searchParams;
      if (searchParams.get("_rsc")) return false;
      if (pathname.startsWith("/view")) return true;
      if (pathname.startsWith("/user")) return true;
      return false;
    },
    handler: "NetworkFirst",
    options: {
      cacheName: "pages",
      expiration: {
        maxEntries: 32,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      },
      networkTimeoutSeconds: 10,
    },
  },
];
