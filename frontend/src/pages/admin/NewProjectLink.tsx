import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Paper,
    TextField,
    Button,
    Stack,
    Alert,
    useTheme,
    Chip,
    CircularProgress,
} from '@mui/material';
import { Add, Link as LinkIcon } from '@mui/icons-material';
import { getAuthHeader } from '../../utils/authUtils';
import { ancillaryApi } from '../../api/ancillary';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';
import { StatusBanner } from '../../components/admin/StatusBanner';
import type { Project } from '../../types/project';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

export default function NewProjectLink() {
    const { uuid } = useParams<{ uuid: string }>();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [project, setProject] = useState<Project | null>(null);
    const [loadingProject, setLoadingProject] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [keywordInput, setKeywordInput] = useState('');
    const [keywords, setKeywords] = useState<string[]>([]);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/v1/admin/projects/${uuid}`, {
                    headers: getAuthHeader(),
                });
                if (!response.ok) throw new Error('Failed to fetch project');
                const data = await response.json();
                setProject(data);
            } catch (err) {
                console.error('Failed to load project:', err);
                setError('Failed to load project details');
            } finally {
                setLoadingProject(false);
            }
        };
        if (uuid) fetchProject();
    }, [uuid]);

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
        if (!project?.uuid) return;

        if (!name || !url || keywords.length === 0) {
            setError('Name, URL and at least one keyword are required');
            return;
        }

        setSaving(true);
        setError(null);
        try {
            await ancillaryApi.createLink(project.uuid, {
                name,
                url,
                keywords,
            });
            navigate(`/admin/projects/${uuid}/links`);
        } catch (err) {
            console.error('Failed to create link:', err);
            setError('Failed to create link. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loadingProject) {
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
                        { label: project.name, path: `/admin/projects/${uuid}/links` },
                        { label: 'New Link' },
                    ]}
                />

                {/* Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <LinkIcon sx={{ fontSize: 32, color: '#6366f1' }} />
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
                            Add Link Response
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="outlined"
                            onClick={() => navigate(`/admin/projects/${uuid}/links`)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={handleSubmit}
                            disabled={saving}
                        >
                            {saving ? 'Creating...' : 'Create Link'}
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
                            label="Display Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Official Documentation"
                            fullWidth
                            required
                        />

                        <TextField
                            label="URL"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com/..."
                            fullWidth
                            required
                        />

                        <Box>
                            <Typography variant="subtitle2" gutterBottom>
                                Trigger Keywords
                            </Typography>
                            <Typography variant="caption" color="text.secondary" paragraph>
                                Type a keyword and press Enter. This link will appear when the chat response contains any of these keywords.
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
