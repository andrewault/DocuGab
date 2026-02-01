import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface DetailRowProps {
    icon?: ReactNode;
    label: string;
    value: string | number | ReactNode;
    valueProps?: {
        fontWeight?: number | string;
        fontFamily?: string;
        color?: string;
    };
}

/**
 * DetailRow component for displaying a label-value pair with optional icon
 * Common pattern used in detail pages for info fields
 */
export function DetailRow({ icon, label, value, valueProps = {} }: DetailRowProps) {
    return (
        <Box>
            <Typography
                variant="caption"
                color="text.secondary"
                display="flex"
                alignItems="center"
                gap={0.5}
            >
                {icon}
                {label}
            </Typography>
            <Typography variant="body1" {...valueProps}>
                {value || '—'}
            </Typography>
        </Box>
    );
}
