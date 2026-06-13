# Production Deployment Guide

## Prerequisites

- Docker & Docker Compose
- PostgreSQL credentials
- Rails master key

## Environment Setup

### 1. Create `.env.prod` file

```bash
DATABASE_PASSWORD=your_secure_password
RAILS_MASTER_KEY=your_rails_master_key
```

Get your Rails master key:
```bash
cat config/master.key
```

### 2. Build Docker Image

```bash
docker-compose -f docker-compose.prod.yml build
```

### 3. Start Services

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Run Migrations

```bash
docker-compose -f docker-compose.prod.yml exec web bundle exec rails db:migrate
```

## Vite Build Optimization

### Asset Minification

Production builds automatically minify and optimize:

- JavaScript: Terser with aggressive compression
- CSS: Tailwind CSS + PostCSS optimization
- Images: Asset file organization

### Code Splitting

Large dependencies are automatically split into chunks:

- `react` + `react-dom` → separate vendor chunk
- `@inertiajs/react` → separate chunk
- Other vendors → shared vendor chunk

### Cache Busting

All assets include content hashes for automatic cache busting:

```
assets/[name].[hash].js
assets/[name].[hash].css
```

## Build Commands

### Development Build
```bash
npm run dev  # Runs Vite dev server with hot reload
```

### Production Build
```bash
npm run build  # Optimized production build
```

### Preview Production Build
```bash
npm run preview  # Serves production build locally
```

### Test Build
```bash
npm run build:test  # Build optimized for testing
```

## Performance Monitoring

### Check Bundle Size

```bash
npm run build
# Check public/vite-prod directory for asset sizes
```

### Enable Source Maps (Development)

Source maps are automatically enabled in development and disabled in production.

To enable in production:
```
VITE_ENABLE_SOURCEMAPS=true npm run build
```

## Docker Optimization

### Multi-Stage Build

`Dockerfile.prod` uses a multi-stage build to:

1. Build frontend assets in Node.js image
2. Compile Rails assets
3. Copy only necessary files to runtime image
4. Remove build dependencies and caches

Result: Significantly smaller production image size

### Health Checks

Database includes health checks to ensure service readiness before starting application.

## Troubleshooting

### Issue: Assets not loading

1. Verify Vite build completed: `docker-compose logs web | grep -i build`
2. Check public/vite-prod directory exists
3. Verify Rails asset_host is configured (if using CDN)

### Issue: CSS not applying

1. Verify Tailwind build: `npm run build -- --mode production`
2. Check `@source` directive in `app/javascript/application.css`
3. Confirm css files in public/vite-prod

### Issue: Bundle size too large

1. Check code splitting in vite.config.ts rollupOptions
2. Use `npm run preview` to analyze
3. Consider removing unused dependencies: `npm audit`
