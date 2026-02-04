# Plan: Unified Local & AWS Deployment Strategy

## Current Issues
The recent deployment debugging revealed several structural weaknesses in how the application handles environments:
1.  **Widespread Hardcoding**: Over 50 files contain `import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007'`. This makes it impossible to change the API target reliably without modifying code.
2.  **Proxy Inconsistency**: The Production Nginx configuration stripped paths (`/api/`) which clashed with the Backend's expected routes, whereas local development often bypasses Nginx (connecting directly to port 8000 or using Vite proxy).
3.  **Build vs. Runtime Ambiguity**: Vite requires build-time injection of variables, but we attempted to inject them at runtime in Kubernetes, failing until we hardcoded them.

## Goals
1.  **Write Once, Run Anywhere**: The frontend Docker image should be environment-agnostic. It should not need to be rebuilt to change the API target.
2.  **Single Source of Truth**: Remove all 50+ hardcoded localhost fallbacks.
3.  **Relative Pathing**: Use relative paths (`/api/v1/...`) so the browser automatically uses the current origin (Localhost, LoadBalancer, or Domain).

## Implementation Steps

### 1. frontend/src Refactor (High Priority)
- **Action**: Create a centralized configuration file `src/config/api.ts`.
- **Content**:
  ```typescript
  // src/config/api.ts
  export const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'; // Default to relative
  ```
- **Action**: Find and replace all 50 occurrences of the hardcoded fallback with `import { API_BASE } from '@/config/api'`.

### 2. Vite Proxy for Local Dev
To make relative paths (`/api/...`) work when running `npm run dev` (where there is no Nginx):
- **Action**: Configure `vite.config.ts` server proxy:
  ```typescript
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // Forward relative /api requests to local backend
        changeOrigin: true,
      }
    }
  }
  ```
- **Result**: Developers can use `/api/v1/auth/me` locally, and it works. Production uses `/api/v1/auth/me` via Nginx, and it works. **Identical code path.**

### 3. Nginx Configuration (Standardized)
- **Action**: Keep the "Preserve Path" configuration confirmed in **v9**.
  ```nginx
  location /api/ {
      proxy_pass http://docutok-backend; # No trailing slash
  }
  ```
- **Action**: Use this same Nginx config for local `docker-compose` testing to ensure "Production-like" behavior locally.

### 4. Docker & Kubernetes
- **Action**: Remove `VITE_API_BASE_URL` from `k8s/frontend.yaml` runtime envs (it's useless for Vite).
- **Action**: Set `VITE_API_BASE_URL=""` (empty) or `/api` in the Dockerfile build args as a default.
- **Benefit**: The container simply serves stats assets that look for `/api`. It doesn't care where it's hosted.

## Future Improvements
- **Runtime Configuration Injection**: For true runtime config (e.g., if API is on a totally different domain), inject a `window.__ENV__` object via a script tag in `index.html` at container startup (using `envsubst`). This avoids rebuilding the image just to change a URL.
