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
                backgroundColor: isReady ? '#6465F0' : '#f44336',
                color: 'white',
                fontWeight: 600,
            }}
        />
    );
};
