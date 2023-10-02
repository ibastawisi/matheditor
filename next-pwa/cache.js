"use strict";

// Workbox RuntimeCaching config: https://developers.google.com/web/tools/workbox/reference-docs/latest/module-workbox-build#.RuntimeCachingEntry
module.exports = [
  {
    urlPattern: ({ url: { pathname }, sameOrigin }) => {
      if (!sameOrigin) return false;
      if (pathname === "/") return true;
      if (pathname === "/playground") return true;
      if (pathname === "/tutorial") return true;
      if (pathname === "/privacy") return true;
      if (pathname === "/dashboard") return true;
      if (pathname.startsWith("/new")) return true;
      if (pathname.startsWith("/edit")) return true;
      return false;
    },
    handler: "StaleWhileRevalidate",
    method: "GET",
    options: {
      cacheName: "pages",
      plugins: [
        {
          cacheKeyWillBeUsed: async ({ request }) => {
            const url = new URL(request.url);
            const pathname = url.pathname;
            const page = pathname.split("/")[1];
            const rsc = request.headers.get("RSC") === "1";
            return `/${page}${rsc ? `?_rsc` : ""}`;
          }
        },
        {
          cacheWillUpdate: async ({ request, response }) => {
            if (!request.headers.get("update")) return;
            return response;
          }
        }
      ]
    },
  },
  {
    urlPattern: ({ url: { pathname }, sameOrigin }) => {
      if (!sameOrigin) return false;
      if (pathname === "/api/auth/session") return true;
      if (pathname === "/api/documents") return true;
      return false;
    },
    handler: "NetworkFirst",
    method: "GET",
    options: {
      cacheName: "apis",
      expiration: {
        maxEntries: 16,
        maxAgeSeconds: 24 * 60 * 60 * 30,
      },
      networkTimeoutSeconds: 10,
    },
  },
];
