import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import {defineConfig} from 'vite'
import {VitePWA} from 'vite-plugin-pwa';
import "vitest/config"

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp',
        },
    },
    optimizeDeps: {
        exclude: ['@sqlite.org/sqlite-wasm'],
    },
    plugins: [
        react(),
        legacy(),
        VitePWA({
            includeAssets: ['/public/**/*'],
            manifest: {
                name: 'OeVA Beta',
                short_name: 'OeVA Beta',
                display: "standalone",
                theme_color: '#000000'
            },
            pwaAssets: {
                config: true,
            },
            workbox: {
                // workbox options for more advanced scenarios
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'osm-tile-cache',
                            expiration: {
                                maxEntries: 10000,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                ]
            },
        }),
    ],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/setupTests.ts',
    }
})
