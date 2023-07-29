import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import copy from 'rollup-plugin-copy';
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    copy({
      targets: [
        {
          src: 'node_modules/pspdfkit/dist/pspdfkit-lib',
          dest: 'public/',
        },
      ],
      hook: 'buildStart',
    }),
    VitePWA({
      injectRegister: null,
      strategies: 'injectManifest',
      injectManifest: {
        maximumFileSizeToCacheInBytes: 15000000,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,DS_Store,woff,woff2,stamp,json,blat,wasm,dat,dll,icc,ttf,3,bin,pdf}'],
        navigateFallback: 'offline.html',
      },
      devOptions: {
        enabled: true,
        type: 'module',
      }
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '#': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  server: {
    host: true,
    hmr: { overlay: true },
  },
})
