import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
    Box,
    Container,
    Typography,
    Paper,
    TextField,
    MenuItem,
    Button,
    Stack,
    Alert,
    useTheme,
    Chip,
    CircularProgress,
} from '@mui/material';
import { Save, Image as ImageIcon, YouTube as YouTubeIcon, CloudUpload, ArrowBack } from '@mui/icons-material';
import { getAuthHeader } from '../../utils/authUtils';
import { ancillaryApi } from '../../api/ancillary';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';
import { StatusBanner } from '../../components/admin/StatusBanner';
import type { Project } from '../../types/project';
import { API_BASE } from '@/config/api';

export default function ProjectMediaEdit() {
    const { uuid, mediaUuid } = useParams<{ uuid: string; mediaUuid: string }>();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [type, setType] = useState<'photo' | 'youtube'>('photo');
    const [url, setUrl] = useState('');
    const [description, setDescription] = useState('');
    const [keywordInput, setKeywordInput] = useState('');
    const [keywords, setKeywords] = useState<string[]>([]);

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
                setType(mediaData.type);
                setUrl(mediaData.url);
                setDescription(mediaData.description || '');
                setKeywords(mediaData.keywords || []);
            } catch (err) {
                console.error('Failed to load data:', err);
                setError('Failed to load project or media details');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [uuid, mediaUuid]);

    const handleAddKeyword = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && keywordInput.trim()) {
            e.preventDefault();
            if (!keywords.includes(keywordInput.trim())) {
                setKeywords([...keywords, keywordInput.trim()]);
            }
            setKeywordInput('');
        }
    };

    const handleDeleteKeyword = (kwToDelete: string) => {
        setKeywords(keywords.filter((kw) => kw !== kwToDelete));
    };

    const handleSubmit = async () => {
        if (!project?.uuid || !mediaUuid) return;

        if (!url || keywords.length === 0) {
            setError('URL and at least one keyword are required');
            return;
        }

        setSaving(true);
        setError(null);
        try {
            await ancillaryApi.updateMedia(project.uuid, mediaUuid, {
                type,
                url,
                description,
                keywords,
            });
            navigate(`/admin/projects/${uuid}/media`);
        } catch (err) {
            console.error('Failed to update media:', err);
            setError('Failed to update media item. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!project) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Alert severity="error">Project not found</Alert>
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
                        { label: 'Edit Media' },
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
                        {type === 'photo' ? <ImageIcon sx={{ fontSize: 32, color: '#6366f1' }} /> : <YouTubeIcon sx={{ fontSize: 32, color: '#ff0000' }} />}
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
                            Edit Media
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="outlined"
                            onClick={() => navigate(`/admin/projects/${uuid}/media`)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Save />}
                            onClick={handleSubmit}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </Stack>
                </Stack>

                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        borderRadius: 2,
                        bgcolor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'background.paper',
                    }}
                >
                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    <Stack spacing={3}>
                        <TextField
                            select
                            label="Type"
                            value={type}
                            onChange={(e) => setType(e.target.value as 'photo' | 'youtube')}
                            fullWidth
                        >
                            <MenuItem value="photo">Photo (Image URL)</MenuItem>
                            <MenuItem value="youtube">YouTube (Video URL)</MenuItem>
                        </TextField>

                        <TextField
                            label="URL"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder={type === 'photo' ? 'https://example.com/image.jpg' : 'https://youtube.com/watch?v=...'}
                            fullWidth
                            required
                        />

                        {/* Preview */}
                        {url && type === 'photo' && (
                            <Box
                                component="img"
                                src={url.startsWith('/') ? `${API_BASE}${url}` : url}
                                sx={{
                                    width: '100%',
                                    maxHeight: 200,
                                    objectFit: 'contain',
                                    borderRadius: 1,
                                    bgcolor: 'black',
                                    p: 1,
                                    mt: 2,
                                    mb: 2,
                                }}
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                        )}

                        {type === 'photo' && (
                            <Box sx={{ mb: 2 }}>
                                <ImageDropzone
                                    onUpload={async (file) => {
                                        try {
                                            setSaving(true);
                                            const result = await ancillaryApi.uploadImage(file);
                                            setUrl(result.url);
                                        } catch (err) {
                                            console.error('Upload failed', err);
                                            setError('Failed to upload image');
                                        } finally {
                                            setSaving(false);
                                        }
                                    }}
                                    disabled={saving}
                                />

                                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                                    or paste a URL below
                                </Typography>
                            </Box>
                        )}

                        <TextField
                            label="Description / Caption"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            multiline
                            rows={3}
                            fullWidth
                        />

                        <Box>
                            <Typography variant="subtitle2" gutterBottom>
                                Trigger Keywords
                            </Typography>
                            <Typography variant="caption" color="text.secondary" paragraph>
                                Type a keyword and press Enter. This media will appear when the chat response contains any of these keywords.
                            </Typography>

                            <TextField
                                value={keywordInput}
                                onChange={(e) => setKeywordInput(e.target.value)}
                                onKeyDown={handleAddKeyword}
                                placeholder="Add keyword..."
                                fullWidth
                                size="small"
                                sx={{ mb: 2 }}
                            />

                            <Paper variant="outlined" sx={{ p: 2, minHeight: 60, bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'grey.50' }}>
                                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                                    {keywords.map((kw) => (
                                        <Chip
                                            key={kw}
                                            label={kw}
                                            onDelete={() => handleDeleteKeyword(kw)}
                                        />
                                    ))}
                                    {keywords.length === 0 && (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                            No keywords added yet
                                        </Typography>
                                    )}
                                </Stack>
                            </Paper>
                        </Box>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}

function ImageDropzone({ onUpload, disabled }: { onUpload: (file: File) => void, disabled: boolean }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                onUpload(acceptedFiles[0]);
            }
        },
        accept: {
            'image/*': []
        },
        maxFiles: 1,
        disabled
    });

    return (
        <Box
            {...getRootProps()}
            sx={{
                border: '2px dashed',
                borderColor: isDragActive ? 'primary.main' : isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                borderRadius: 2,
                p: 4,
                bgcolor: isDragActive
                    ? (isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)')
                    : (isDark ? 'rgba(0,0,0,0.2)' : 'grey.50'),
                textAlign: 'center',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                    borderColor: disabled ? undefined : 'primary.main',
                    bgcolor: disabled ? undefined : (isDark ? 'rgba(0,0,0,0.3)' : 'grey.100')
                }
            }}
        >
            <input {...getInputProps()} />
            <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.primary" gutterBottom>
                {isDragActive ? "Drop the image here" : "Drag and drop an image here, or click to select"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
                Supports JPG, PNG, GIF, WEBP
            </Typography>
        </Box>
    );
}
