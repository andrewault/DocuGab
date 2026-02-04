import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Paper,
    Button,
    Stack,
    Alert,
    useTheme,
    Chip,
    CircularProgress,
    Divider,
    Grid,
} from '@mui/material';
import { Edit, Image as ImageIcon, YouTube as YouTubeIcon, ArrowBack } from '@mui/icons-material';
import { getAuthHeader } from '../../utils/authUtils';
import { ancillaryApi } from '../../api/ancillary';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';
import { StatusBanner } from '../../components/admin/StatusBanner';
import type { Project } from '../../types/project';
import { API_BASE } from '@/config/api';

export default function ProjectMediaDetail() {
    const { uuid, mediaUuid } = useParams<{ uuid: string; mediaUuid: string }>();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [project, setProject] = useState<Project | null>(null);
    const [media, setMedia] = useState<any>(null); // TODO: Type properly
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!uuid || !mediaUuid) return;

            try {
                // Fetch Project
                const projRes = await fetch(`${API_BASE}/api/v1/admin/projects/${uuid}`, {
                    headers: getAuthHeader(),
                });
                if (!projRes.ok) throw new Error('Failed to fetch project');
                const projData = await projRes.json();
                setProject(projData);

                // Fetch Media
                const mediaData = await ancillaryApi.getMediaItem(uuid, mediaUuid);
                setMedia(mediaData);
            } catch (err) {
                console.error('Failed to load data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [uuid, mediaUuid]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!project || !media) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Alert severity="error">Project or Media not found</Alert>
            </Container>
        );
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: isDark
                    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
                    : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #f8fafc 100%)',
                py: 4,
            }}
        >
            <Container maxWidth={false} sx={{ px: 3 }}>
                <StatusBanner
                    message={
                        project.is_demo
                            ? 'Demo Project • Internal use only, not billed'
                            : !project.is_active
                                ? 'Project Inactive'
                                : !project.is_enabled
                                    ? 'Project Disabled'
                                    : ''
                    }
                    visible={project.is_demo || !project.is_active || !project.is_enabled}
                />
                <AdminBreadcrumbs
                    items={[
                        { label: 'Customers', path: '/admin/customers' },
                        { label: project.customer_name, path: project.customer_uuid ? `/admin/customers/${project.customer_uuid}` : undefined },
                        { label: project.name, path: `/admin/projects/${uuid}/media` },
                        { label: 'Media Detail' },
                    ]}
                />

                {/* Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                            startIcon={<ArrowBack />}
                            onClick={() => navigate(`/admin/projects/${uuid}/media`)}
                            sx={{ mr: 1 }}
                        >
                            Back
                        </Button>
                        {media.type === 'photo' ? <ImageIcon sx={{ fontSize: 32, color: '#6366f1' }} /> : <YouTubeIcon sx={{ fontSize: 32, color: '#ff0000' }} />}
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
                            Media Detail
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<Edit />}
                        onClick={() => navigate(`/admin/projects/${uuid}/media/${mediaUuid}/edit`)}
                    >
                        Edit Media
                    </Button>
                </Stack>

                <Grid container spacing={4}>
                    {/* Left Column: Preview */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper
                            elevation={3}
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                bgcolor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'background.paper',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                minHeight: 300,
                                overflow: 'hidden'
                            }}
                        >
                            {media.type === 'photo' ? (
                                <Box
                                    component="img"
                                    src={media.url.startsWith('/') ? `${API_BASE}${media.url}` : media.url}
                                    sx={{
                                        width: '100%',
                                        maxHeight: 500,
                                        objectFit: 'contain',
                                        borderRadius: 1,
                                    }}
                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                            ) : (
                                <Typography variant="body1" color="text.secondary">
                                    Video Preview Not Available (YouTube)
                                </Typography>
                            )}
                        </Paper>
                    </Grid>

                    {/* Right Column: Details */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper
                            elevation={3}
                            sx={{
                                p: 4,
                                borderRadius: 2,
                                bgcolor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'background.paper',
                                height: '100%'
                            }}
                        >
                            <Stack spacing={3}>
                                <Box>
                                    <Typography variant="overline" color="text.secondary">
                                        Type
                                    </Typography>
                                    <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                                        {media.type}
                                    </Typography>
                                </Box>

                                {media.image_metadata && (
                                    <Box>
                                        <Typography variant="overline" color="text.secondary">
                                            Image Details
                                        </Typography>
                                        <Stack spacing={1} mt={1}>
                                            {media.image_metadata.filename && (
                                                <Typography variant="body2">
                                                    <strong>Original Filename:</strong> {media.image_metadata.filename}
                                                </Typography>
                                            )}
                                            {media.image_metadata.content_type && (
                                                <Typography variant="body2">
                                                    <strong>Type:</strong> {media.image_metadata.content_type}
                                                </Typography>
                                            )}
                                            {media.image_metadata.size_bytes && (
                                                <Typography variant="body2">
                                                    <strong>Size:</strong> {(media.image_metadata.size_bytes / 1024).toFixed(2)} KB
                                                </Typography>
                                            )}
                                        </Stack>
                                    </Box>
                                )}

                                <Box>
                                    <Typography variant="overline" color="text.secondary">
                                        Source URL
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            wordBreak: 'break-all',
                                            fontFamily: 'monospace',
                                            bgcolor: isDark ? 'rgba(0,0,0,0.3)' : 'grey.100',
                                            p: 1,
                                            borderRadius: 1
                                        }}
                                    >
                                        {media.url}
                                    </Typography>
                                </Box>

                                <Divider />

                                <Box>
                                    <Typography variant="overline" color="text.secondary">
                                        Description
                                    </Typography>
                                    <Typography variant="body1">
                                        {media.description || 'No description provided.'}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="overline" color="text.secondary">
                                        Trigger Keywords
                                    </Typography>
                                    <Box sx={{ mt: 1 }}>
                                        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                                            {media.keywords.map((kw: string) => (
                                                <Chip
                                                    key={kw}
                                                    label={kw}
                                                />
                                            ))}
                                            {media.keywords.length === 0 && (
                                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                    No keywords
                                                </Typography>
                                            )}
                                        </Stack>
                                    </Box>
                                </Box>
                            </Stack>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}
