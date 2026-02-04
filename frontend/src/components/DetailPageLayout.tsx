import React from 'react';
import { Box, Container, Stack, useTheme } from '@mui/material';
import AdminBreadcrumbs from './AdminBreadcrumbs';

interface BreadcrumbItem {
    label: string;
    path?: string;
}

interface DetailPageLayoutProps {
    breadcrumbs: BreadcrumbItem[];
    header: React.ReactNode;
    actions?: React.ReactNode;
    children: React.ReactNode;
}

/**
 * Standardized layout for admin detail pages.
 * Provides consistent structure with breadcrumbs, header, actions, and content area.
 */
export default function DetailPageLayout({
    breadcrumbs,
    header,
    actions,
    children,
}: DetailPageLayoutProps) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    return (
        <Box
            sx={{
                minHeight: '100vh',
                py: 4,
                background: isDark
                    ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
                    : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
            }}
        >
            <Container maxWidth={false} sx={{ px: 3 }}>
                <AdminBreadcrumbs items={breadcrumbs} />

                {/* Header and Actions */}
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={4}
                    flexWrap="wrap"
                    gap={2}
                >
                    {header}
                    {actions && (
                        <Stack direction="row" spacing={2}>
                            {actions}
                        </Stack>
                    )}
                </Stack>

                {/* Content */}
                {children}
            </Container>
        </Box>
    );
}
