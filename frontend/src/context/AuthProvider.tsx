import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuthStore } from '../stores/authStore';

interface AuthProviderProps {
    children: ReactNode;
}

/**
 * AuthProvider - Now uses Zustand authStore instead of Context API
 * 
 * This component initializes the auth state on mount and provides
 * a migration path from the old Context API to Zustand.
 * 
 * Usage:
 * - Old: const { user, login, logout } = useAuth();
 * - New: const { user, login, logout } = useAuthStore();
 */
export function AuthProvider({ children }: AuthProviderProps) {
    const refreshUser = useAuthStore((state) => state.refreshUser);

    useEffect(() => {
        // Initialize auth state on mount
        refreshUser();
    }, [refreshUser]);

    return <>{children}</>;
}

// Re-export the hook for backwards compatibility
// This allows existing code to continue using useAuth() 
// while we migrate to direct useAuthStore() usage
export { useAuthStore as useAuth };
