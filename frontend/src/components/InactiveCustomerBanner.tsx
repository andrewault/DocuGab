import { Alert } from '@mui/material';
import { useAuth } from '../context/AuthProvider';

export default function InactiveCustomerBanner() {
    const { user } = useAuth();

    // Only show banner if user belongs to a customer and that customer is inactive
    if (!user || !user.customer_id || user.customer_is_active !== false) {
        return null;
    }

    return (
        <Alert
            severity="error"
            sx={{
                mb: 3,
                backgroundColor: '#f44336',
                color: 'white',
                '& .MuiAlert-icon': {
                    color: 'white',
                },
            }}
        >
            This account is deactivated. Contact Customer Support.
        </Alert>
    );
}
