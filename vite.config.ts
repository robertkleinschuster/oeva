import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa';
import "vitest/config"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy(),
    VitePWA({
      includeAssets: ['/public/**/*'],
      injectRegister: "script",
      manifest: {
        name: 'OeVA Beta',
      },
      pwaAssets: {
        config: true,
      },
      workbox: {
        // workbox options for more advanced scenarios
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  }
})
