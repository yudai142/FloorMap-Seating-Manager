// Service Worker for offline support and caching

const CACHE_VERSION = 'v1'
const CACHE_NAME = `floormap-${CACHE_VERSION}`
const ASSETS_TO_CACHE = [
  '/',
  '/icon.png',
  '/icon.svg'
]

declare const self: ServiceWorkerGlobalScope

// Install event
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE)
    }).then(() => self.skipWaiting())
  )
})

// Activate event
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch event - Network first strategy
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip cross-origin requests
  if (request.url.startsWith('http') && !request.url.startsWith(self.location.origin)) {
    return
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response
        }

        // Clone response for caching
        const clonedResponse = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, clonedResponse)
        })

        return response
      })
      .catch(() => {
        // Return cached response on network failure
        return caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }

            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/')
            }

            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable'
            })
          })
      })
  )
})

// Background sync for offline actions
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'sync-check-ins') {
    event.waitUntil(syncCheckIns())
  }
})

async function syncCheckIns(): Promise<void> {
  const db = await openIndexedDB()
  const pendingCheckIns = await getUnsynced(db)

  for (const checkIn of pendingCheckIns) {
    try {
      const response = await fetch(`/seats/${checkIn.seatId}/check_in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ occupant_name: checkIn.name })
      })

      if (response.ok) {
        await removeUnsynced(db, checkIn.id)
      }
    } catch (error) {
      console.error('Sync failed:', error)
    }
  }
}

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('floormap', 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('pendingCheckIns')) {
        db.createObjectStore('pendingCheckIns', { keyPath: 'id' })
      }
    }
  })
}

function getUnsynced(db: IDBDatabase): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pendingCheckIns', 'readonly')
    const store = transaction.objectStore('pendingCheckIns')
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

function removeUnsynced(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pendingCheckIns', 'readwrite')
    const store = transaction.objectStore('pendingCheckIns')
    const request = store.delete(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}
