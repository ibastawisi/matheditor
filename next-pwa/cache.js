"use strict";

// Workbox RuntimeCaching config: https://developers.google.com/web/tools/workbox/reference-docs/latest/module-workbox-build#.RuntimeCachingEntry
/** @type {import('workbox-build').RuntimeCaching[]} */
module.exports = [
  {
    urlPattern: ({ request, url: { pathname }, sameOrigin }) => {
      if (request.headers.get("update")) return false;
      if (!sameOrigin) return false;
      if (navigator.onLine && pathname.match(/\/new\/\w+/)) return false;
      return [
        "",
        "playground",
        "tutorial",
        "privacy",
        "dashboard",
        "new",
        "edit",
      ].includes(pathname.split("/")[1]);
    },
    handler: "CacheFirst",
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
      ]
    },
  },
  {
    urlPattern: ({ url: { pathname }, sameOrigin }) => {
      if (!sameOrigin) return false;
      return pathname.startsWith("/api/thumbnails");
    },
    handler: "CacheFirst",
    method: "GET",
    options: {
      cacheName: "thumbnails",
      expiration: {
        maxAgeSeconds: 24 * 60 * 60 * 30,
      },
    },
  },
  {
    urlPattern: ({ url: { pathname }, sameOrigin }) => {
      if (!sameOrigin) return false;
      if (pathname === "/api/auth/session") return true;
      if (pathname === "/api/documents") return true;
      if (pathname === "/api/usage") return true;
      return false;
    },
    handler: "NetworkFirst",
    method: "GET",
    options: {
      cacheName: "apis",
      expiration: {
        maxAgeSeconds: 24 * 60 * 60 * 30,
      },
      networkTimeoutSeconds: 10,
    },
  },
  {
    urlPattern: ({ url: { pathname }, sameOrigin }) => {
      if (!sameOrigin) return false;
      if (pathname.startsWith("/api")) return false;
      return true;
    },
    handler: "NetworkFirst",
    options: {
      cacheName: "others",
      plugins: [
        {
          cacheWillUpdate: async () => void 0,
        }
      ]
    },
  },
];