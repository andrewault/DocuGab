/**
 * Authenticated fetch wrapper with automatic token refresh on 401 errors.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

/**
 * Refresh the access token using the refresh token.
 * Returns the new access token.
 */
async function refreshAccessToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
        throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        throw new Error('Token refresh failed');
    }

    const { access_token, refresh_token: newRefresh } = await response.json();
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', newRefresh);

    return access_token;
}

/**
 * Authenticated fetch that automatically refreshes tokens on 401 errors.
 * 
 * @param url - The URL to fetch
 * @param options - Fetch options (headers will be merged with auth header)
 * @returns Promise resolving to the Response
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    // Get current access token
    let accessToken = localStorage.getItem('access_token');

    // Add authorization header
    const headers = new Headers(options.headers);
    if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
    }

    // Make the request
    let response = await fetch(url, { ...options, headers });

    // If 401, try to refresh token and retry
    if (response.status === 401) {
        // Prevent multiple simultaneous refresh attempts
        if (!isRefreshing) {
            isRefreshing = true;
            refreshPromise = refreshAccessToken()
                .finally(() => {
                    isRefreshing = false;
                    refreshPromise = null;
                });
        }

        try {
            // Wait for refresh to complete
            accessToken = await refreshPromise!;

            // Retry the original request with new token
            headers.set('Authorization', `Bearer ${accessToken}`);
            response = await fetch(url, { ...options, headers });
        } catch {
            // Refresh failed, return the 401 response
            return response;
        }
    }

    return response;
}

/**
 * Get authorization header for manual fetch calls.
 * @deprecated Use authFetch instead for automatic token refresh
 */
export function getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}
