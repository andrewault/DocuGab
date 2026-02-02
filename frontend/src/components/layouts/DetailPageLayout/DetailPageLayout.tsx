import { Box, Container, Stack, Typography } from '@mui/material';
import { ReactNode } from 'react';

interface BreadcrumbItem {
    label: string;
    path?: string;
}

interface DetailPageLayoutProps {
    breadcrumbs?: ReactNode; // Allow passing custom breadcrumb component
    title: string;
    titleIcon?: ReactNode;
    actions?: ReactNode;
    children: ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | false;
    statusBanner?: ReactNode;
}

/**
 * StandardizedDetail Page Layout
 * 
 * Provides consistent structure for all detail pages with:
 * - Optional breadcrumbs
 * - Title with optional icon
 * - Action buttons section
 * - Content area with responsive max-width
 * - Optional status banner
 */
export function DetailPageLayout({
    breadcrumbs,
    title,
    titleIcon,
    actions,
    children,
    maxWidth = false,
    statusBanner,
}: DetailPageLayoutProps) {
    return (
        <Container maxWidth={maxWidth} sx={{ mt: 4, mb: 8, px: 3 }}>
            {/* Optional Status Banner */}
            {statusBanner}

            {/* Breadcrumbs */}
            {breadcrumbs}

            {/* Header */}
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={4}
                mt={breadcrumbs ? 2 : 0}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {titleIcon}
                    <Typography
                        variant="h4"
                        component="h1"
                        sx={{
                            fontWeight: 700,
                            background: 'linear-gradient(90deg, #6366f1, #10b981)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        {title}
                    </Typography>
                </Box>

                {actions && (
                    <Stack direction="row" spacing={2}>
                        {actions}
                    </Stack>
                )}
            </Stack>

            {/* Content */}
            {children}
        </Container>
    );
}
