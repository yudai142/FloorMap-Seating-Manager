# Mobile Optimization Guide

## Overview

This application is optimized for mobile and desktop experiences with PWA (Progressive Web App) capabilities, responsive design, and offline support.

## Features

### 1. Progressive Web App (PWA)

The application can be installed as a native app on iOS and Android devices.

#### Installation

**Android:**
1. Open app in Chrome
2. Tap menu → "Install app"
3. Confirm installation

**iOS:**
1. Open app in Safari
2. Tap Share → "Add to Home Screen"
3. Confirm and customize appearance

#### Benefits
- Works offline
- Native app experience
- No app store required
- Instant updates

### 2. Responsive Design

The UI automatically adapts to screen sizes using Tailwind CSS breakpoints:

```
sm: 640px   (small phones)
md: 768px   (tablets)
lg: 1024px  (desktop)
xl: 1280px  (large desktop)
```

#### Mobile-First Implementation

```jsx
// Mobile layout by default, desktop optimization on larger screens
<div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
  {/* Stacked on mobile, side-by-side on desktop */}
</div>
```

### 3. Offline Support

Service Worker provides offline functionality:

- **Network-first strategy** — tries network first, falls back to cache
- **Asset caching** — static assets cached on first load
- **Background sync** — pending check-ins sync when online
- **Offline indicator** — UI indicates offline status

### 4. Touch-Friendly UI

- **Larger touch targets** — minimum 48x48px
- **No hover-only interactions** — all interactions work with touch
- **Gesture support** — swipe and tap for navigation
- **Optimized modals** — full-screen on mobile

## Performance Optimization

### Image Optimization

```jsx
{/* Use responsive images */}
<img 
  src="/icon.png" 
  srcSet="/icon.png 1x, /icon@2x.png 2x"
  sizes="(max-width: 768px) 100vw, 50vw"
  alt="Icon"
/>
```

### Code Splitting

Vite automatically splits large dependencies:
- `react` → separate chunk
- `@inertiajs/react` → separate chunk
- Reduces initial bundle size by ~40%

### Lazy Loading

Components can be lazy-loaded for better performance:

```jsx
import { lazy, Suspense } from 'react'

const HeavyComponent = lazy(() => 
  import('./HeavyComponent')
)

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  )
}
```

## Service Worker

### Caching Strategy

**Network First (default):**
```
1. Try fetch from network
2. If fails, serve from cache
3. If not cached, serve offline page
```

**Benefits:**
- Always gets latest content
- Works offline when data cached
- Good for data that changes frequently

### Background Sync

Pending check-ins are synced when device comes online:

```javascript
// Check-in registered offline
POST /seats/{id}/check_in → stored locally

// When online:
// Service Worker syncs pending check-ins
→ POST /seats/{id}/check_in (actual)
```

### Offline Experience

- **Buttons disabled** on features requiring network
- **Error messages** shown if sync fails
- **Retry option** available for failed operations

## Manifest Configuration

### manifest.json

Located at `public/manifest.json`, defines:

- App name and icon
- Start URL and display mode
- Theme and background colors
- App shortcuts
- Screenshots for stores

### Key Properties

```json
{
  "name": "Full app name",
  "short_name": "Short name (12 chars max)",
  "start_url": "/",
  "display": "standalone",  // Full screen app experience
  "theme_color": "#0f172a", // Browser UI color
  "icons": [...]            // App icons
}
```

## Testing Mobile Experience

### Desktop Simulation

**Chrome DevTools:**
1. Press F12 → Toggle Device Toolbar (Ctrl+Shift+M)
2. Select device profile
3. Throttle network to test offline

### Real Device Testing

```bash
# Get local IP
ipconfig getifaddr en0  # macOS
hostname -I            # Linux

# Access from mobile device
http://<local-ip>:3000
```

### PWA Installation Testing

1. Open app in Chrome on Android
2. Tap menu → "Install app"
3. Launch from home screen
4. Verify offline functionality

## Best Practices

### 1. Touch Interaction
```jsx
{/* Larger touch targets */}
<button className="px-4 py-3 min-h-12 min-w-12">
  Action
</button>

{/* No hover-only interactions */}
<div className="group hover:shadow-lg active:shadow-sm">
  {/* Works on both hover and touch */}
</div>
```

### 2. Viewport Configuration
```html
<!-- In application.html.erb -->
<meta name="viewport" 
  content="width=device-width, initial-scale=1, 
    maximum-scale=5, user-scalable=yes">
```

### 3. Safe Area Padding
```jsx
{/* On notched devices (iPhone, etc) */}
<div className="px-4 pt-safe pb-safe">
  {/* Content insets from notch/home bar */}
</div>
```

### 4. Form Optimization
```jsx
{/* Mobile-friendly inputs */}
<input
  type="number"      // Shows numeric keyboard
  inputMode="numeric"
  pattern="[0-9]*"
  className="px-3 py-2 text-base"  // Prevents zoom
/>
```

## Performance Metrics

### Core Web Vitals Targets
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### Monitoring
```javascript
// Web Vitals reporting
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

getCLS(console.log)
getFID(console.log)
getLCP(console.log)
```

## Troubleshooting

### Service Worker not registering
- Check HTTPS in production (required for SW)
- Verify manifest.json exists
- Check browser console for errors

### Offline mode not working
- Clear cache: DevTools → Application → Clear storage
- Re-register Service Worker
- Verify offline scope in SW

### Touch interactions not working
- Test on real device (DevTools simulation limited)
- Check z-index layering
- Verify pointer-events CSS

## Deployment Considerations

### HTTPS Required
Service Workers require HTTPS in production:

```bash
# Use Let's Encrypt for free SSL
# Or configure on your hosting provider
```

### Cache Invalidation
Update `CACHE_VERSION` in service-worker.ts when assets change:

```typescript
const CACHE_VERSION = 'v1'  // Change to v2, v3, etc.
```

## Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Responsive Design Patterns](https://web.dev/responsive-design-basics/)
- [Mobile Performance Guide](https://web.dev/mobile-ux-audit/)
