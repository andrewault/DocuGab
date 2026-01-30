import { useState, useEffect, type ReactNode } from 'react';
import { AuthContext, type User } from './AuthContext';
import { getAuthHeader } from '../utils/authUtils';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCurrentUser = async (token: string) => {
        const response = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch user');
        const userData = await response.json();
        setUser(userData);
    };

    const refreshTokens = async (refreshToken: string) => {
        const response = await fetch(`${API_BASE}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!response.ok) throw new Error('Refresh failed');
        const { access_token, refresh_token: newRefresh } = await response.json();
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', newRefresh);
        await fetchCurrentUser(access_token);
    };

    const clearTokens = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
    };

    // Check for stored tokens on mount
    useEffect(() => {
        const init = async () => {
            const accessToken = localStorage.getItem('access_token');
            if (accessToken) {
                try {
                    await fetchCurrentUser(accessToken);
                } catch {
                    // Token expired, try refresh
                    const refreshToken = localStorage.getItem('refresh_token');
                    if (refreshToken) {
                        try {
                            await refreshTokens(refreshToken);
                        } catch {
                            // Refresh failed, clear tokens
                            clearTokens();
                        }
                    }
                }
            }
            setIsLoading(false);
        };
        init();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const login = async (email: string, password: string) => {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Login failed');
        }

        const { access_token, refresh_token } = await response.json();
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        await fetchCurrentUser(access_token);
    };

    const register = async (email: string, password: string, fullName?: string) => {
        const response = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, full_name: fullName }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Registration failed');
        }

        // Auto-login after registration
        await login(email, password);
    };

    const logout = async () => {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
            try {
                const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                // Add auth header if available, but logout should work even if token expired
                const auth = getAuthHeader();
                if (auth.Authorization) {
                    headers.Authorization = auth.Authorization;
                }

                await fetch(`${API_BASE}/api/auth/logout`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ refresh_token: refreshToken }),
                });
            } catch {
                // Ignore logout errors
            }
        }
        clearTokens();
    };

    const refreshAuth = async () => {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
            await refreshTokens(refreshToken);
        }
    };

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
    };

    const isAuthenticated = user !== null;
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated,
                isLoading,
                isAdmin,
                login,
                register,
                logout,
                refreshAuth,
                updateUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
