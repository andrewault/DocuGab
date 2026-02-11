import { Chip } from '@mui/material';

interface ReadinessBadgeProps {
    isReady: boolean;
    size?: 'small' | 'medium';
}

export const ReadinessBadge = ({ isReady, size = 'small' }: ReadinessBadgeProps) => {
    return (
        <Chip
            label={isReady ? 'Ready' : 'Unready'}
            size={size}
            sx={{
                backgroundColor: isReady ? '#9c27b0' : '#f44336', // Purple 500 : Red 500
                color: 'white',
                fontWeight: 600,
            }}
        />
    );
};
