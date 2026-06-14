import '../application.css'
import { createInertiaApp } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'

createInertiaApp({
  resolve: name => {
    const pages = import.meta.glob('../components/**/*.jsx', { eager: true })
    const page = pages[`../components/${name}.jsx`]
    if (!page) {
      console.error(`Component not found: ${name}`)
      console.log('Available components:', Object.keys(pages))
    }
    return page
  },
  setup({ el, App, props }) {
    if (el && App) {
      createRoot(el).render(<App {...props} />)
    } else {
      console.error('Missing el or App in Inertia setup', { el, App })
    }
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
