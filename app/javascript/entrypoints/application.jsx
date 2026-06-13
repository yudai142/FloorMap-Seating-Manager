import '../application.css'
import { createInertiaApp } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'

createInertiaApp({
  resolve: name => {
    const pages = import.meta.glob('../components/**/*.jsx', { eager: true })
    return pages[`../components/${name}.jsx`]
  },
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />)
  }
})

// Register Service Worker for PWA support
if ('serviceWorker' in navigator && !navigator.serviceWorker.controller) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js', {
      scope: '/'
    }).catch(error => {
      console.warn('Service Worker registration failed:', error)
    })
  })
}
