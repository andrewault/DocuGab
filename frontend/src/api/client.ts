/**
 * Type-safe API Client
 * 
 * Auto-generated TypeScript client from FastAPI OpenAPI schema.
 * Provides compile-time type safety for all API calls.
 * 
 * To regenerate:
 * npm run generate:api
 */

// Note: The generated client will be created in ./generated/
// after running npm run generate:api
// 
// For now, we'll export a placeholder and document the pattern.
// The actual generated exports will be available after generation.

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

/**
 * Fetch wrapper with automatic auth token injection
 */
export async function apiFetch(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('access_token');

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
    });

    // Handle 401 - token expired
    if (response.status === 401) {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
            try {
                const refreshResponse = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh_token: refreshToken }),
                });

                if (refreshResponse.ok) {
                    const data = await refreshResponse.json();
                    localStorage.setItem('access_token', data.access_token);
                    localStorage.setItem('refresh_token', data.refresh_token);

                    // Retry the original request
                    headers['Authorization'] = `Bearer ${data.access_token}`;
                    return fetch(`${API_BASE_URL}${url}`, { ...options, headers });
                }
            } catch (err) {
                // Refresh failed, logout
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
            }
        } else {
            // No refresh token, redirect to login
            window.location.href = '/login';
        }
    }

    return response;
}

/**
 * Type-safe API helpers
 * These will be replaced by generated client methods
 */
export const api = {
    get: async <T>(url: string): Promise<T> => {
        const response = await apiFetch(url);
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        return response.json();
    },

    post: async <T>(url: string, data?: any): Promise<T> => {
        const response = await apiFetch(url, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(error.detail || `API Error: ${response.statusText}`);
        }
        return response.json();
    },

    put: async <T>(url: string, data?: any): Promise<T> => {
        const response = await apiFetch(url, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        return response.json();
    },

    delete: async <T>(url: string): Promise<T> => {
        const response = await apiFetch(url, { method: 'DELETE' });
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        return response.json();
    },
};

// After running npm run generate:api, import and re-export generated services:
// export * from './generated/services';
// export * from './generated/models';
