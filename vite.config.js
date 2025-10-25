import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/story-app/",
  plugins: [
    VitePWA({
      manifest: {
        id: "/story-app/",
        name: "Story App",
        short_name: "Story App",
        description: "A simple story app built with PWA",
        theme_color: "#ffffff",
        icons: [
          {
            src: "/story-app/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/story-app/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
        screenshots: [
          {
            src: "/story-app/images/screenshot1.png",
            sizes: "1280x720",
            type: "image/png",
            form_factor: "wide",
            label: "Homepage",
          },
          {
            src: "/story-app/images/screenshot2.png",
            sizes: "720x1280",
            type: "image/png",
            form_factor: "narrow",
            label: "Add Story Page",
          },
        ],
        shortcuts: [
          {
            name: "Add Story",
            short_name: "Add Story",
            description: "Add a new story",
            url: "/story-app/#/add-story",
            icons: [{ src: "/story-app/icons/add-icon.png", sizes: "192x192" }],
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,jpg,jpeg,svg}"],
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/story-api.dicoding.dev\/v1\/stories/,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 3,
              cacheableResponse: {
                statuses: [200],
              },
              backgroundSync: {
                name: "api-queue",
                options: {
                  maxRetentionTime: 24 * 60, // 24 hours in minutes
                },
              },
            },
          },
          {
            urlPattern: /^https?:\/\/story-api.dicoding.dev\/images\/.*/,
            handler: "CacheFirst",
            options: {
              cacheName: "image-cache",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
        importScripts: ["sw-push.js", "sw-sync.js"],
      },
    }),
  ],
});
