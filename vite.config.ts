import { type PluginOption, defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'import.meta.env.VERCEL_ANALYTICS_ID': JSON.stringify(process.env.VERCEL_ANALYTICS_ID),
    'import.meta.env.BACKEND_URL': JSON.stringify(process.env.BACKEND_URL),
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          mathlive: ['mathlive'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
    }),
    VitePWA({
      registerType: "prompt",
      // add this to cache all the imports
      workbox: {
        globPatterns: ["**/*"],
        maximumFileSizeToCacheInBytes: 10000000,
      },
      // add this to cache all the
      // static assets in the public folder
      includeAssets: [
        "**/*",
      ],
      manifest: {
        "short_name": "Math Editor",
        "name": "Math Editor",
        "description": "Write math reports as Easy as Pi",
        "orientation": "portrait",
        "dir": "ltr",
        "related_applications": [
          {
            "platform": "web",
            "url": "https://mateditor.ml"
          }
        ],
        "prefer_related_applications": true,
        "categories": [
          "education"
        ],
        "icons": [
          {
            "src": "favicon.ico",
            "sizes": "32x32",
            "type": "image/x-icon"
          },
          {
            "src": "/logo.svg",
            "type": "image/svg+xml",
            "sizes": "512x512"
          },
          {
            "src": "logo192.png",
            "type": "image/png",
            "sizes": "192x192"
          },
          {
            "src": "logo512.png",
            "type": "image/png",
            "sizes": "512x512",
            "purpose": "any maskable"
          }
        ],
        "file_handlers": [
          {
            "action": "/open",
            "accept": {
              "text/x-troff-me": [
                ".me"
              ]
            },
            "icons": [
              {
                "src": "logo512.png",
                "type": "image/png",
                "sizes": "512x512"
              },
              {
                "src": "logo192.png",
                "type": "image/png",
                "sizes": "192x192"
              }
            ],
            "launch_type": "single-client"
          }
        ],
        "start_url": ".",
        "display": "standalone",
        "theme_color": "#121212",
        "background_color": "#181818"
      },
    }),
  ],
});