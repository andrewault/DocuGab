import { Box, Typography, CircularProgress, Alert, ThemeProvider, Link as MuiLink } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useThemeMode } from '../context/ThemeContext';
import { useProject } from '../context/ProjectContext';
import { createProjectTheme } from '../utils/themeUtils';
import { type ReactNode } from 'react';

interface BrandedChatWrapperProps {
    children: ReactNode;
}

/**
 * Wrapper component that applies project branding to chat interface
 * Shows loading state, error state, and branded header
 */
export default function BrandedChatWrapper({ children }: BrandedChatWrapperProps) {
    const { effectiveTheme } = useThemeMode();
    const { project, loading, error } = useProject();

    // Loading state
    if (loading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="100vh"
            >
                <CircularProgress />
            </Box>
        );
    }

    // Error state
    if (error || !project) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="100vh"
                p={3}
            >
                <Alert severity="error" sx={{ maxWidth: 600 }}>
                    {error || 'Project not found. Please check the URL.'}
                </Alert>
            </Box>
        );
    }

    // Create branded theme
    const brandedTheme = createProjectTheme({
        color_primary: project.color_primary,
        color_secondary: project.color_secondary,
        color_background: project.color_background,
    }, effectiveTheme);

    return (
        <ThemeProvider theme={brandedTheme}>
            <Box
                sx={{
                    minHeight: '100vh',
                    bgcolor: 'background.default',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Branded Header */}
                <Box
                    sx={{
                        p: 3,
                        borderBottom: 1,
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                    }}
                >
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                        {/* Logo */}
                        {project.logo && (
                            <Box
                                component="img"
                                src={project.logo}
                                alt={project.name}
                                sx={{
                                    height: 40,
                                    objectFit: 'contain',
                                }}
                            />
                        )}

                        {/* Title */}
                        <Typography variant="h5" fontWeight={600}>
                            {project.title}
                        </Typography>
                    </Box>

                    {/* Subtitle */}
                    {project.subtitle && (
                        <Typography variant="subtitle1" color="text.secondary" mb={1}>
                            {project.subtitle}
                        </Typography>
                    )}

                    {/* Body */}
                    {project.body && (
                        <Typography variant="body2" color="text.secondary">
                            {project.body}
                        </Typography>
                    )}

                    {/* Return Link */}
                    {project.return_link && (
                        <Box mt={2}>
                            <MuiLink
                                href={project.return_link}
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                }}
                            >
                                <ArrowBack fontSize="small" />
                                {project.return_link_text || 'Back'}
                            </MuiLink>
                        </Box>
                    )}
                </Box>

                {/* Chat Content */}
                <Box flex={1}>
                    {children}
                </Box>
            </Box>
        </ThemeProvider>
    );
}
