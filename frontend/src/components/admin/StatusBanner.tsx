import { Alert } from '@mui/material';

interface StatusBannerProps {
    message: string;
    visible: boolean;
}

/**
 * StatusBanner component for displaying special status messages
 * Used for demo projects, internal customers, etc.
 */
export function StatusBanner({ message, visible }: StatusBannerProps) {
    if (!visible) return null;

    return (
        <Alert
            severity="info"
            sx={{
                mb: 3,
                backgroundColor: '#1976d2',
                color: 'white',
                '& .MuiAlert-icon': { color: 'white' },
            }}
        >
            {message}
        </Alert>
    );
}
