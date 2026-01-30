import { createContext, useContext } from 'react';

export interface User {
    id: number;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    role: string;
    is_active: boolean;
    is_verified: boolean;
    theme: string;
    timezone: string;
    customer_id: number | null;
    customer_uuid: string | null;
    customer_name: string | null;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isAdmin: boolean;
    isCustomer: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullName?: string) => Promise<void>;
    logout: () => void;
    refreshAuth: () => Promise<void>;
    updateUser: (updatedUser: User) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
