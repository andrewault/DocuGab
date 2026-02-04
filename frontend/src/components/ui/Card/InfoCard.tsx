import { Paper, Typography, Stack, Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import type { ReactNode } from 'react';

export interface InfoCardProps {
    title?: string;
    icon?: ReactNode;
    children: ReactNode;
    action?: ReactNode;
    sx?: SxProps<Theme>;
}

/**
 * InfoCard - Display structured information in a consistent card layout
 * Used in detail pages for grouping related information
 */
export function InfoCard({ title, icon, children, action, sx }: InfoCardProps) {
    return (
        <Paper elevation={2} sx={{ p: 3, ...sx }}>
            {(title || icon || action) && (
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {icon}
                        {title && (
                            <Typography variant="h6" fontWeight={600}>
                                {title}
                            </Typography>
                        )}
                    </Box>
                    {action}
                </Stack>
            )}
            {children}
        </Paper>
    );
}
