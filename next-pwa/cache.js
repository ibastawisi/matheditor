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
            const pathname = new URL(request.url).pathname;
            const id = pathname.split("/")[2];
            if (id) return;
            return response;
          }
        }
      ]
    },
  },
];
