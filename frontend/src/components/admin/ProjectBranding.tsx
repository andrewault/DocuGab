import { Box, Typography, Paper, Stack, Divider } from '@mui/material';
import { Palette } from '@mui/icons-material';
import type { Project } from '../../types/project';
import { API_BASE } from '@/config/api';

interface ProjectBrandingProps {
    project: Project;
}

export function ProjectBranding({ project }: ProjectBrandingProps) {
    return (
        <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                <Palette sx={{ mr: 1, verticalAlign: 'bottom' }} />
                Branding
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
                <Box sx={{ flex: 1 }}>
                    <Stack spacing={2}>
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                Chatbot Project Name
                            </Typography>
                            <Typography variant="body1" fontWeight={500}>
                                {project.title}
                            </Typography>
                        </Box>

                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                Subtitle
                            </Typography>
                            <Typography variant="body1">
                                {project.subtitle || '—'}
                            </Typography>
                        </Box>
                    </Stack>
                </Box>

                <Box sx={{ flex: 1 }}>
                    <Stack spacing={2}>
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                Colors
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 1,
                                        bgcolor: project.color_primary,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                    }}
                                    title={`Primary: ${project.color_primary}`}
                                />
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 1,
                                        bgcolor: project.color_secondary,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                    }}
                                    title={`Secondary: ${project.color_secondary}`}
                                />
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 1,
                                        bgcolor: project.color_background,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                    }}
                                    title={`Background: ${project.color_background}`}
                                />
                            </Stack>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Primary • Secondary • Background
                            </Typography>
                        </Box>

                        {project.logo && (
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Logo
                                </Typography>
                                <Box sx={{ mt: 1 }}>
                                    <img
                                        src={`${API_BASE}${project.logo}`}
                                        alt="Project Logo"
                                        style={{
                                            maxWidth: '200px',
                                            maxHeight: '100px',
                                            objectFit: 'contain',
                                        }}
                                    />
                                </Box>
                            </Box>
                        )}

                        {project.return_link && (
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Return Link
                                </Typography>
                                <Typography variant="body1">
                                    {project.return_link_text || 'Back'} → {project.return_link}
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                </Box>
            </Stack>

            {project.body && (
                <>
                    <Divider sx={{ my: 3 }} />
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Body Content
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 1 }}>
                            {project.body}
                        </Typography>
                    </Box>
                </>
            )}
        </Paper>
    );
}
