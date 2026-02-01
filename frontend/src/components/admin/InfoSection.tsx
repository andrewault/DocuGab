import { Paper, Stack, Typography, Divider } from '@mui/material';
import type { ReactNode } from 'react';

interface InfoSectionProps {
    title: string;
    icon?: React.ReactNode;
    children: ReactNode;
    action?: ReactNode;
}

/**
 * InfoSection component for displaying informational content in a consistent Paper layout
 * Used across admin detail pages for organizing content into sections
 */
export function InfoSection({ title, icon, children, action }: InfoSectionProps) {
    return (
        <Paper sx={{ p: 3, mb: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    {icon}
                    <Typography variant="h6">{title}</Typography>
                </Stack>
                {action}
            </Stack>
            <Divider sx={{ mb: 2 }} />
            {children}
        </Paper>
    );
}
