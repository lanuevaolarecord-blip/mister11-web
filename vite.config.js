import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Plugin Vite: ejecuta los handlers serverless de /api/* en desarrollo local.
 * Esto permite que /api/ia-generate funcione en dev sin Vercel CLI.
 */
function serverlessApiPlugin(env) {
  return {
    name: 'vite-plugin-serverless-api',
    configureServer(server) {
      server.middlewares.use('/api/ia-generate', async (req, res) => {
        // Inyectar la GROQ_API_KEY del .env (sin prefijo VITE_) en process.env
        process.env.GROQ_API_KEY = env.GROQ_API_KEY || process.env.GROQ_API_KEY || ''

        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json' })
          return res.end(JSON.stringify({ error: 'Método no permitido. Usa POST.' }))
        }

        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body || '{}')
            // Simular el objeto req/res de Vercel
            const fakeReq = { method: 'POST', body: parsed }
            const fakeRes = {
              statusCode: 200,
              headers: {},
              status(code) { this.statusCode = code; return this },
              setHeader(k, v) { this.headers[k] = v; return this },
              json(data) {
                res.writeHead(this.statusCode, { 'Content-Type': 'application/json', ...this.headers })
                res.end(JSON.stringify(data))
              }
            }
            // Importar el handler dinámicamente
            const handlerModule = await import('./api/ia-generate.js?t=' + Date.now())
            const handler = handlerModule.default
            await handler(fakeReq, fakeRes)
          } catch (err) {
            console.error('[vite-serverless] Error ejecutando handler:', err)
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Error interno del servidor de desarrollo.' }))
          }
        })
      })
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    resolve: {
      alias: {
        'firebase/firestore': path.resolve(__dirname, 'src/firebase/firestore-proxy.js')
      }
    },
    plugins: [
      react(),
      serverlessApiPlugin(env),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
          maximumFileSizeToCacheInBytes: 5000000,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            // ── Imágenes de Firebase Storage (escudos de equipo, avatares) ───────
            {
              urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'firebase-storage-images',
                expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 días
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            // ── Assets de la app propios (logos, iconos) ────────────────────────
            {
              urlPattern: /\.(png|jpg|jpeg|svg|webp|ico)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'app-images',
                expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 7 }, // 7 días
                cacheableResponse: { statuses: [0, 200] }
              }
            }
          ]
        },
        manifest: {
          name: 'Míster 11',
          short_name: 'Míster 11',
          description: 'Plataforma para Entrenadores de Fútbol',
          theme_color: '#0D1A2D',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'landscape',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
          ]
        }
      })
    ],
    base: '/',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
              return 'vendor-react'
            }
            if (id.includes('node_modules/firebase')) {
              return 'vendor-firebase'
            }
            if (id.includes('node_modules/fabric')) {
              return 'vendor-fabric'
            }
          }
        }
      }
    }
  }
})