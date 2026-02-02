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
 * - import { useAuth } from '../hooks/useAuth';
 * - const { user, login, logout } = useAuth();
 */
export function AuthProvider({ children }: AuthProviderProps) {
    const refreshUser = useAuthStore((state) => state.refreshUser);

    useEffect(() => {
        // Initialize auth state on mount
        refreshUser();
    }, [refreshUser]);

    return <>{children}</>;
}

// Export separately to avoid Fast Refresh warning
// eslint-disable-next-line react-refresh/only-export-components
export { useAuthStore as useAuth } from '../stores/authStore';
