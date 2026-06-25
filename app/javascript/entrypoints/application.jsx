import '../application.css'
import { createInertiaApp } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'

createInertiaApp({
  resolve: name => {
    const pages = import.meta.glob('../components/**/*.jsx', { eager: true })
    const path = `../components/${name}.jsx`
    const page = pages[path]

    if (!page) {
      console.error(`[Inertia] Component not found: ${name}`)
      console.error(`[Inertia] Attempted path: ${path}`)
      console.warn('[Inertia] Available components:', Object.keys(pages).map(k => k.replace('../components/', '').replace('.jsx', '')))
      return { default: () => <div style={{ padding: '20px', color: 'red' }}>Component not found: {name}</div> }
    }

    return page
  },
  setup({ el, App, props }) {
    if (!el) {
      console.error('[Inertia] Missing DOM element with id="app"')
      return
    }
    if (!App) {
      console.error('[Inertia] App component is not defined')
      return
    }
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
