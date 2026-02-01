/**
 * API configuration constants
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

// Use v1 API by default
export const API_BASE_URL = `${BASE_URL}/api/v1`;

// Legacy base for reference (redirects to v1 but causes CORS issues)
export const API_BASE_URL_LEGACY = `${BASE_URL}/api`;
