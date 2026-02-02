/**
 * Backwards-compatible useAuth hook
 * 
 * Re-exports useAuthStore for backwards compatibility.
 * This allows existing code to continue using useAuth()
 * while we migrate to direct useAuthStore() usage.
 */
export { useAuthStore as useAuth } from '../stores/authStore';
