import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress } from '@mui/material';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
    children: ReactNode;
    requireAdmin?: boolean;
    requireCustomer?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false, requireCustomer = false }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, isAdmin, isCustomer } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (!isAuthenticated) {
        // Redirect to login, saving the attempted location
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requireAdmin && !isAdmin) {
        // Redirect non-admins to home
        return <Navigate to="/" replace />;
    }

    if (requireCustomer && !isCustomer) {
        // Redirect non-customers to home
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
