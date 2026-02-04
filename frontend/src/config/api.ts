/**
 * Centralized API Configuration
 * 
 * This file acts as the single source of truth for the API base URL.
 * 
 * Strategy:
 * 1. Build-time Env: used if `VITE_API_BASE_URL` is baked in (e.g. Docker build args).
 * 2. Runtime/Default: defaults to `/api` (relative path) which is the preferred
 *    method for containerized deployments (Nginx reverse proxy).
 * 
 * This allows the same build artifact to work on:
 * - Localhost (via Vite proxy forwarding /api -> http://localhost:8000)
 * - AWS/Production (via Nginx forwarding /api -> internal backend)
 */

export const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
