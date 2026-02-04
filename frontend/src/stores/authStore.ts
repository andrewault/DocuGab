import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    uuid: string;
    email: string;
    full_name: string | null;
    role: string;
    customer_id: number | null;
    customer_uuid: string | null;
    timezone?: string;
    is_active: boolean;
    theme?: string;
    avatar_url?: string | null;
    is_verified?: boolean;
    customer_is_active?: boolean | null;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;

    // Computed helpers (for backwards compatibility)
    isAdmin: boolean;
    isCustomer: boolean;
    isLoading: boolean;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullName: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    updateUser: (user: User) => void;
    setUser: (user: User | null) => void;
    refreshToken: () => Promise<void>;
    setLoading: (loading: boolean) => void;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: localStorage.getItem('access_token'),
            isAuthenticated: !!localStorage.getItem('access_token'),
            isLoading: false,
            isAdmin: false,
            isCustomer: false,

            setLoading: (loading: boolean) => set({ isLoading: loading }),

            login: async (email: string, password: string) => {
                const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                if (!response.ok) {
                    const error = await response.json().catch(() => ({ detail: 'Login failed' }));
                    throw new Error(error.detail || 'Login failed');
                }

                const data = await response.json();
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('refresh_token', data.refresh_token);

                set({
                    accessToken: data.access_token,
                    isAuthenticated: true,
                });

                // Fetch user details
                await get().refreshUser();
            },

            register: async (email: string, password: string, fullName: string) => {
                const response = await fetch(`${API_BASE}/api/v1/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        password,
                        full_name: fullName,
                    }),
                });

                if (!response.ok) {
                    const error = await response.json().catch(() => ({ detail: 'Registration failed' }));
                    throw new Error(error.detail || 'Registration failed');
                }

                const data = await response.json();
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('refresh_token', data.refresh_token);

                set({
                    accessToken: data.access_token,
                    isAuthenticated: true,
                });

                await get().refreshUser();
            },

            logout: async () => {
                const token = localStorage.getItem('access_token');

                try {
                    if (token) {
                        await fetch(`${API_BASE}/api/v1/auth/logout`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                            },
                        });
                    }
                } catch (err) {
                    console.error('Logout error:', err);
                } finally {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    set({
                        user: null,
                        accessToken: null,
                        isAuthenticated: false,
                        isAdmin: false,
                        isCustomer: false,
                    });
                }
            },

            refreshUser: async () => {
                const token = localStorage.getItem('access_token');
                if (!token) {
                    set({ user: null, isAuthenticated: false });
                    return;
                }

                try {
                    const response = await fetch(`${API_BASE}/api/v1/auth/me`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    });

                    if (response.ok) {
                        const user = await response.json();
                        set({
                            user,
                            isAuthenticated: true,
                            isAdmin: user.role === 'admin' || user.role === 'superadmin',
                            isCustomer: user.role === 'customer',
                        });
                    } else {
                        // Token is invalid
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('refresh_token');
                        set({ user: null, accessToken: null, isAuthenticated: false });
                    }
                } catch (err) {
                    console.error('Failed to refresh user:', err);
                    set({ user: null, isAuthenticated: false });
                }
            },

            refreshToken: async () => {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                const response = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ refresh_token: refreshToken }),
                });

                if (!response.ok) {
                    // Refresh token is invalid, logout
                    await get().logout();
                    throw new Error('Session expired');
                }

                const data = await response.json();
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('refresh_token', data.refresh_token);

                set({ accessToken: data.access_token });
            },

            updateUser: (user: User) => set({ user }),

            setUser: (user: User | null) => set({
                user,
                isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
                isCustomer: user?.role === 'customer',
            }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                // Only persist these fields
                accessToken: state.accessToken,
                user: state.user,
            }),
            onRehydrateStorage: () => (state) => {
                // After rehydration, update computed flags based on persisted user
                if (state?.user) {
                    state.isAdmin = state.user.role === 'admin' || state.user.role === 'superadmin';
                    state.isCustomer = state.user.role === 'customer';
                }
            },
        }
    )
);

// Initialize auth state on app load
if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
        useAuthStore.getState().refreshUser();
    }
}
