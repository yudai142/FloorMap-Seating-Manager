import { defineConfig } from 'vite'
import RubyPlugin from 'vite-plugin-ruby'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [RubyPlugin(), tailwindcss(), react()],

  server: {
    host: '0.0.0.0',
    port: 3036,
    middlewareMode: false,
    hmr: {
      host: process.env.VITE_HMR_HOST || 'localhost',
      port: process.env.VITE_HMR_PORT || 3036,
      protocol: process.env.VITE_HMR_PROTOCOL || 'http'
    }
  },

  build: {
    target: 'es2020',
    minify: 'terser',
    sourcemap: process.env.NODE_ENV !== 'production',
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          inertia: ['@inertiajs/react'],
          vendor: ['@rails/actioncable']
        },
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/png|jpe?g|gif|svg|webp|ico/i.test(ext)) {
            return `assets/images/[name].[hash][extname]`
          } else if (/woff|woff2|eot|ttf|otf/.test(ext)) {
            return `assets/fonts/[name].[hash][extname]`
          } else if (ext === 'css') {
            return `assets/[name].[hash][extname]`
          }
          return `assets/[name].[hash][extname]`
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production'
      }
    }
  }
})
