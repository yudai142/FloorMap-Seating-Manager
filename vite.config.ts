import { defineConfig } from 'vite'
import RubyPlugin from 'vite-plugin-ruby'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [RubyPlugin(), tailwindcss(), react()],
  server: {
    host: '0.0.0.0',
    port: 3036
  }
})
