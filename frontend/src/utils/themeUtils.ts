import { createTheme, type Theme } from '@mui/material/styles';

interface ProjectBranding {
    color_primary: string;
    color_secondary: string;
    color_background: string;
}

/**
 * Generate a dynamic MUI theme based on project branding
 */
export function createProjectTheme(branding: ProjectBranding, mode: 'light' | 'dark'): Theme {
    return createTheme({
        palette: {
            mode,
            primary: {
                main: branding.color_primary,
            },
            secondary: {
                main: branding.color_secondary,
            },
            background: {
                ...(mode === 'light' && {
                    default: branding.color_background,
                }),
            },
        },
    });
}
