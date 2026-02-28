import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/thelemic-calendar/",

  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",

      // Se till att SW-navigering alltid faller tillbaka till rätt index under subpath
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: "/thelemic-calendar/index.html",
      },

      manifest: {
        name: "Thelemic Calendar",
        short_name: "Thelema",
        start_url: "/thelemic-calendar/",
        scope: "/thelemic-calendar/",
        display: "standalone",
        theme_color: "#000000",
        background_color: "#000000",

        // RELATIVA paths (viktigt) – då hamnar de under base
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
});