import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  // GitHub Pages project site
  base: "/thelemic-calendar/",

  // Bygg direkt till /docs så GitHub Pages kan servera den
  build: {
    outDir: "docs",
    emptyOutDir: true,
  },

  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        // Viktigt för project pages:
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
        // Relativa så de hamnar under base:
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
});