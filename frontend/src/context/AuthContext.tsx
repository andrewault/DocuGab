import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface User {
    id: number;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    role: string;
    is_active: boolean;
    is_verified: boolean;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isAdmin: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullName?: string) => Promise<void>;
    logout: () => void;
    refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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
    }, []);

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
                await fetch(`${API_BASE}/api/auth/logout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
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
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Helper to get auth header for API calls
export function getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}
