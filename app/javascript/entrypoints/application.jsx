import '../application.css'
import { createInertiaApp } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'

const ErrorFallback = ({ name, path }) => (
  <div style={{
    padding: '40px 20px',
    color: '#dc2626',
    fontFamily: 'monospace',
    background: '#fef2f2',
    border: '2px solid #fca5a5',
    borderRadius: '8px',
    margin: '20px'
  }}>
    <h2>🚨 Component Resolution Error</h2>
    <p><strong>Component:</strong> {name}</p>
    <p><strong>Path:</strong> {path}</p>
    <p style={{ fontSize: '12px', color: '#991b1b' }}>
      Check browser console for available components and troubleshooting info.
    </p>
  </div>
)

createInertiaApp({
  resolve: name => {
    try {
      const pages = import.meta.glob('../components/**/*.jsx', { eager: true })
      const path = `../components/${name}.jsx`
      const page = pages[path]

      if (!page || !page.default) {
        const componentList = Object.keys(pages)
          .map(k => k.replace('../components/', '').replace('.jsx', ''))
          .sort()

        console.error(`[Inertia] Component not found: ${name}`)
        console.error(`[Inertia] Attempted path: ${path}`)
        console.warn('[Inertia] Available components:', componentList)

        return {
          default: () => <ErrorFallback name={name} path={path} />
        }
      }

      return page
    } catch (error) {
      console.error('[Inertia] Error in resolve:', error)
      return {
        default: () => <ErrorFallback name={name} path={`Error: ${error.message}`} />
      }
    }
  },
  setup({ el, App, props }) {
    try {
      if (!el) {
        console.error('[Inertia] Missing DOM element with id="app"')
        return
      }
      if (!App) {
        console.error('[Inertia] App component is not defined')
        return
      }
      createRoot(el).render(<App {...props} />)
    } catch (error) {
      console.error('[Inertia] Error in setup:', error)
      if (el) {
        el.innerHTML = `<div style="padding: 20px; color: red; font-family: monospace;">
          <h2>Setup Error</h2>
          <p>${error.message}</p>
        </div>`
      }
    }
  }
})
  .catch(error => {
    console.error('[Inertia] Fatal error:', error)
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
