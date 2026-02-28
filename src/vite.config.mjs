import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf-8")
);

export default defineConfig({
  // GitHub Pages project site:
  base: "/thelemic-calendar/",

  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },

  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",

      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },

      // Viktigt: låt ikonerna vara RELATIVA så base hanteras korrekt.
      manifest: {
        name: "Thelemic Calendar",
        short_name: "Thelema",
        start_url: "/thelemic-calendar/",
        scope: "/thelemic-calendar/",
        display: "standalone",
        theme_color: "#000000",
        background_color: "#000000",

        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" }
        ]
      }
    })
  ]
});