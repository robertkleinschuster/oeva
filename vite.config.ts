import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
      react(),
    VitePWA({
      includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt', 'apple-touch-icon.png', '/public/**/*'],
      injectRegister: "script",
      manifest: {
        name: 'OeVA Beta',
        short_name: 'OeVA Beta',
        theme_color: '#333131',
        icons: [],
      },
      workbox: {
        // workbox options for more advanced scenarios
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
})
