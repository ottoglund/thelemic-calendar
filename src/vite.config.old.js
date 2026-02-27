const { defineConfig } = require("vite");
const { VitePWA } = require("vite-plugin-pwa");

module.exports = defineConfig({
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Thelemiskt Datum",
        short_name: "Thelema",
        description: "Thelemiskt datum med sol, måne och V.E.",
        start_url: "/",
        display: "standalone",
        background_color: "#000000",
        theme_color: "#d4af37",
        orientation: "portrait",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ]
});