import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    VitePWA({
      manifest: {
        id: "/",
        name: "Story App",
        short_name: "Story App",
        description: "A simple story app built with PWA",
        theme_color: "#ffffff",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
        screenshots: [
          {
            src: "/images/screenshot1.png",
            sizes: "1280x720",
            type: "image/png",
            form_factor: "wide",
            label: "Homepage",
          },
          {
            src: "/images/screenshot2.png",
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
            url: "/#/add-story",
            icons: [{ src: "/icons/add-icon.png", sizes: "192x192" }],
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,jpg,jpeg,svg}"],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/story-api.dicoding.dev\/v1\/stories/,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              cacheableResponse: {
                statuses: [200],
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
