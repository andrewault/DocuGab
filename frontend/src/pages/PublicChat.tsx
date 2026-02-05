import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { API_BASE } from '@/config/api';
import Chat from './Chat';
import { darkTheme } from '../theme';

interface PublicProject {
    uuid: string;
    name: string;
    slug: string;
    title: string;
    subtitle?: string;
    logo?: string;
    color_primary: string;
    color_secondary: string;
    color_background: string;
    avatar: string;
    voice: string;
    show_animation: boolean;
    is_ready: boolean;
}

// Create a custom theme based on darkTheme but with specific overrides for Public Chat
const publicTheme = createTheme(darkTheme, {
    components: {
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    backgroundColor: '#ffffff', // White background for input
                    color: '#000000',          // Black text
                    '&:hover': {
                        backgroundColor: '#ffffff',
                    },
                    '&.Mui-focused': {
                        backgroundColor: '#ffffff',
                    },
                },
                input: {
                    color: '#000000',          // Black text input
                    '&::placeholder': {
                        color: '#666666',      // Dark gray placeholder
                        opacity: 1,
                    },
                },
                notchedOutline: {
                    border: 'none',            // Remove border if desired for cleaner look
                }
            }
        },
        MuiInputBase: {
            styleOverrides: {
                root: {
                    color: '#000000',
                }
            }
        }
    }
});

export default function PublicChat() {
    const { slug } = useParams<{ slug: string }>();
    const [project, setProject] = useState<PublicProject | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/v1/public/projects/${slug}`);

                // Check if response is JSON
                const contentType = response.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                    console.error("Received non-JSON response:", await response.text());
                    throw new Error("Unable to connect to chat service (Invalid response format).");
                }

                if (!response.ok) {
                    if (response.status === 404) throw new Error('Chat not found.');
                    throw new Error('Failed to load chat.');
                }
                const data = await response.json();
                setProject(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        if (slug) fetchProject();
    }, [slug]);

    if (loading) return (
        <ThemeProvider theme={publicTheme}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#424242', color: 'text.primary' }}>
                <CircularProgress />
            </Box>
        </ThemeProvider>
    );

    if (error || !project) return (
        <ThemeProvider theme={publicTheme}>
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', minHeight: '100vh', bgcolor: '#424242' }}>
                <Alert severity="error">{error || 'Project not found'}</Alert>
            </Box>
        </ThemeProvider>
    );

    return (
        <ThemeProvider theme={publicTheme}>
            <Box sx={{
                minHeight: '100vh',
                bgcolor: project.color_background, // Use project's background color
                color: project.color_primary, // Keep branded text color for headers
                display: 'flex',
                flexDirection: 'column',
            }}>
                {/* Header */}
                <Box sx={{ p: 3, pb: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
                    {project.logo && (
                        <img src={project.logo.startsWith('http') ? project.logo : `${API_BASE}${project.logo}`}
                            alt="Logo"
                            style={{ height: 48, objectFit: 'contain' }}
                        />
                    )}
                    <Box>
                        <Typography variant="h5" fontWeight="bold" sx={{ color: project.color_primary }}>
                            {project.title}
                        </Typography>
                        {project.subtitle && (
                            <Typography variant="body2" sx={{ color: project.color_secondary }}>
                                {project.subtitle}
                            </Typography>
                        )}
                    </Box>
                </Box>

                {/* Chat Component */}
                <Box sx={{ flex: 1, p: { xs: 1, md: 3 } }}>
                    <Chat
                        projectUuid={project.uuid}
                        primaryColor={project.color_primary}
                        secondaryColor={project.color_secondary}
                        backgroundColor="transparent" // Allow parent gray to show through
                        hideSidebar={true}
                        height="calc(100vh - 120px)"
                        showAnimation={project.show_animation}
                        voice={project.voice}
                        avatar={project.avatar}
                    />
                </Box>
            </Box>
        </ThemeProvider>
    );
}
