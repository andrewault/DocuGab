import React from 'react';
import { Box, Typography } from '@mui/material';

interface DetailFieldProps {
    label: string;
    value: React.ReactNode;
    variant?: 'default' | 'large';
}

/**
 * Standardized field display component for detail pages.
 * Shows a label and value with consistent typography and spacing.
 */
export default function DetailField({ label, value, variant = 'default' }: DetailFieldProps) {
    return (
        <Box>
            <Typography variant="caption" color="text.secondary">
                {label}
            </Typography>
            <Typography
                variant={variant === 'large' ? 'h5' : 'body1'}
                fontWeight={variant === 'large' ? 600 : 500}
                sx={{ mt: variant === 'large' ? 1 : 0.5, whiteSpace: 'pre-wrap' }}
            >
                {value || '—'}
            </Typography>
        </Box>
    );
}
