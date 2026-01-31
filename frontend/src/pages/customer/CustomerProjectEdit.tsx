import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Paper,
    TextField,
    Button,
    Stack,
    CircularProgress,
    Alert,
    useTheme,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { ArrowBack, Save, Edit as EditIcon, CloudUpload, Image as ImageIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { getAuthHeader } from '../../utils/authUtils';
import CustomerBreadcrumbs from '../../components/CustomerBreadcrumbs';

interface Project {
    id: number;
    uuid: string;
    name: string;
    slug: string;
    description: string | null;
    subtitle: string | null;
    body: string | null;
    logo: string | null;
    color_primary: string;
    color_secondary: string;
    color_background: string;
    return_link: string | null;
    return_link_text: string | null;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

export default function CustomerProjectEdit() {
    const { uuid } = useParams<{ uuid: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [body, setBody] = useState('');
    const [colorPrimary, setColorPrimary] = useState('#6366f1');
    const [colorSecondary, setColorSecondary] = useState('#10b981');
    const [colorBackground, setColorBackground] = useState('#ffffff');
    const [returnLink, setReturnLink] = useState('');
    const [returnLinkText, setReturnLinkText] = useState('');
    const [logoModalOpen, setLogoModalOpen] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoUploading, setLogoUploading] = useState(false);
    const [logoError, setLogoError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [currentLogo, setCurrentLogo] = useState<string | null>(null);

    useEffect(() => {
        const fetchProject = async () => {
            if (!uuid || !user) return;

            try {
                setLoading(true);
                const response = await fetch(`${API_BASE}/api/customer/projects/${uuid}`, {
                    headers: getAuthHeader(),
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch project');
                }

                const data: Project = await response.json();
                setName(data.name);
                setSlug(data.slug);
                setDescription(data.description || '');
                setSubtitle(data.subtitle || '');
                setBody(data.body || '');
                setColorPrimary(data.color_primary);
                setColorSecondary(data.color_secondary);
                setColorBackground(data.color_background);
                setReturnLink(data.return_link || '');
                setReturnLinkText(data.return_link_text || '');
                setCurrentLogo(data.logo);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load project');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchProject();
        }
    }, [uuid, user]);

    const handleSave = async () => {
        try {
            setSaving(true);
            setSaveError(null);

            const response = await fetch(`${API_BASE}/api/customer/projects/${uuid}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader(),
                },
                body: JSON.stringify({
                    name,
                    slug,
                    description: description || null,
                    subtitle: subtitle || null,
                    body: body || null,
                    color_primary: colorPrimary,
                    color_secondary: colorSecondary,
                    color_background: colorBackground,
                    return_link: returnLink || null,
                    return_link_text: returnLinkText || null,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Failed to update project');
            }

            setSuccess(true);
            setTimeout(() => {
                navigate(`/customer/${user?.customer_uuid}/projects/${uuid}`);
            }, 1500);
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const handleLogoFileSelect = (file: File) => {
        // Validate PNG
        if (file.type !== 'image/png') {
            setLogoError('Only PNG files are allowed');
            return;
        }

        setLogoError(null);
        setLogoFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setLogoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleLogoDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleLogoFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleLogoDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleLogoUpload = async () => {
        if (!logoFile || !uuid) return;

        try {
            setLogoUploading(true);
            setLogoError(null);

            const formData = new FormData();
            formData.append('file', logoFile);

            const response = await fetch(`${API_BASE}/api/customer/projects/${uuid}/logo`, {
                method: 'POST',
                headers: getAuthHeader(),
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Failed to upload logo');
            }

            // Refresh logo
            setCurrentLogo(`/api/customer/projects/${uuid}/logo?t=${Date.now()}`);
            setLogoModalOpen(false);
            setLogoFile(null);
            setLogoPreview(null);
        } catch (err) {
            setLogoError(err instanceof Error ? err.message : 'Failed to upload logo');
        } finally {
            setLogoUploading(false);
        }
    };

    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
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
                    <Alert severity="error">{error}</Alert>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        onClick={() => navigate(`/customer/${user?.customer_uuid}/projects`)}
                        sx={{ mt: 2 }}
                    >
                        Back to Chatbot Projects
                    </Button>
                </Container>
            </Box>
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
                {/* Breadcrumbs */}
                <CustomerBreadcrumbs
                    items={[
                        { label: 'Chatbot Projects', path: `/customer/${user?.customer_uuid}/projects` },
                        { label: name, path: `/customer/${user?.customer_uuid}/projects/${uuid}` },
                        { label: 'Edit' },
                    ]}
                />

                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                    <EditIcon sx={{ fontSize: 32, color: '#6366f1' }} />
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 700,
                            background: 'linear-gradient(90deg, #6366f1, #10b981)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        Edit Chatbot Project
                    </Typography>
                </Box>

                {/* Form */}
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        borderRadius: 2,
                        bgcolor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'background.paper',
                    }}
                >
                    <Stack spacing={3}>
                        {saveError && (
                            <Alert severity="error" onClose={() => setSaveError(null)}>
                                {saveError}
                            </Alert>
                        )}

                        {success && (
                            <Alert severity="success">
                                Changes saved successfully! Redirecting...
                            </Alert>
                        )}

                        <TextField
                            label="Chatbot Project Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            fullWidth
                            required
                            disabled={saving || success}
                        />

                        <Box>
                            <Typography variant="subtitle2" gutterBottom>
                                Logo
                            </Typography>
                            {currentLogo && (
                                <Box sx={{ mb: 2 }}>
                                    <img
                                        src={`${API_BASE}${currentLogo}`}
                                        alt="Current Logo"
                                        style={{
                                            maxWidth: '200px',
                                            maxHeight: '100px',
                                            objectFit: 'contain',
                                        }}
                                    />
                                </Box>
                            )}
                            <Button
                                variant="outlined"
                                startIcon={<CloudUpload />}
                                onClick={() => setLogoModalOpen(true)}
                                disabled={saving || success}
                            >
                                {currentLogo ? 'Replace Logo' : 'Upload Logo'}
                            </Button>
                        </Box>

                        <TextField
                            label="Description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            fullWidth
                            multiline
                            rows={4}
                            disabled={saving || success}
                            helperText="Optional description for this chatbot project"
                        />

                        <TextField
                            label="Slug"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                            fullWidth
                            required
                            disabled={saving || success}
                            helperText="Unique identifier (auto-generated from name by default)"
                            InputProps={{
                                style: { fontFamily: 'monospace' },
                            }}
                        />

                        <TextField
                            label="Subtitle"
                            value={subtitle}
                            onChange={(e) => setSubtitle(e.target.value)}
                            fullWidth
                            disabled={saving || success}
                            helperText="Optional subtitle"
                        />

                        <TextField
                            label="Body"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            fullWidth
                            multiline
                            rows={8}
                            disabled={saving || success}
                            helperText="Optional body content"
                        />

                        <Box>
                            <Typography variant="subtitle2" gutterBottom>
                                Colors
                            </Typography>
                            <Stack spacing={2}>
                                <Box>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <TextField
                                            label="Primary Color"
                                            value={colorPrimary}
                                            onChange={(e) => setColorPrimary(e.target.value)}
                                            disabled={saving || success}
                                            sx={{ flex: 1 }}
                                            InputProps={{
                                                style: { fontFamily: 'monospace' },
                                            }}
                                        />
                                        <input
                                            type="color"
                                            value={colorPrimary}
                                            onChange={(e) => setColorPrimary(e.target.value)}
                                            disabled={saving || success}
                                            style={{
                                                width: '60px',
                                                height: '56px',
                                                border: '1px solid rgba(0, 0, 0, 0.23)',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                            }}
                                        />
                                    </Stack>
                                </Box>

                                <Box>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <TextField
                                            label="Secondary Color"
                                            value={colorSecondary}
                                            onChange={(e) => setColorSecondary(e.target.value)}
                                            disabled={saving || success}
                                            sx={{ flex: 1 }}
                                            InputProps={{
                                                style: { fontFamily: 'monospace' },
                                            }}
                                        />
                                        <input
                                            type="color"
                                            value={colorSecondary}
                                            onChange={(e) => setColorSecondary(e.target.value)}
                                            disabled={saving || success}
                                            style={{
                                                width: '60px',
                                                height: '56px',
                                                border: '1px solid rgba(0, 0, 0, 0.23)',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                            }}
                                        />
                                    </Stack>
                                </Box>

                                <Box>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <TextField
                                            label="Background Color"
                                            value={colorBackground}
                                            onChange={(e) => setColorBackground(e.target.value)}
                                            disabled={saving || success}
                                            sx={{ flex: 1 }}
                                            InputProps={{
                                                style: { fontFamily: 'monospace' },
                                            }}
                                        />
                                        <input
                                            type="color"
                                            value={colorBackground}
                                            onChange={(e) => setColorBackground(e.target.value)}
                                            disabled={saving || success}
                                            style={{
                                                width: '60px',
                                                height: '56px',
                                                border: '1px solid rgba(0, 0, 0, 0.23)',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                            }}
                                        />
                                    </Stack>
                                </Box>
                            </Stack>
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" gutterBottom>
                                Return Link Settings
                            </Typography>
                            <Stack spacing={2}>
                                <TextField
                                    label="Return Link URL"
                                    value={returnLink}
                                    onChange={(e) => setReturnLink(e.target.value)}
                                    fullWidth
                                    disabled={saving || success}
                                    helperText="Optional URL to return to"
                                    type="url"
                                />

                                <TextField
                                    label="Return Link Text"
                                    value={returnLinkText}
                                    onChange={(e) => setReturnLinkText(e.target.value)}
                                    fullWidth
                                    disabled={saving || success}
                                    helperText="Text to display for the return link"
                                />
                            </Stack>
                        </Box>

                        <Stack direction="row" spacing={2}>
                            <Button
                                variant="contained"
                                startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                                onClick={handleSave}
                                disabled={saving || success || !name.trim()}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<ArrowBack />}
                                onClick={() => navigate(`/customer/${user?.customer_uuid}/projects/${uuid}`)}
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                        </Stack>
                    </Stack>
                </Paper>

                {/* Logo Upload Modal */}
                <Dialog open={logoModalOpen} onClose={() => setLogoModalOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Upload Logo</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            {logoError && (
                                <Alert severity="error" onClose={() => setLogoError(null)}>
                                    {logoError}
                                </Alert>
                            )}

                            <Box
                                onDrop={handleLogoDrop}
                                onDragEnter={handleLogoDrag}
                                onDragLeave={handleLogoDrag}
                                onDragOver={handleLogoDrag}
                                sx={{
                                    border: '2px dashed',
                                    borderColor: dragActive ? 'primary.main' : 'divider',
                                    borderRadius: 2,
                                    p: 4,
                                    textAlign: 'center',
                                    bgcolor: dragActive ? 'action.hover' : 'transparent',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                                onClick={() => document.getElementById('logo-file-input')?.click()}
                            >
                                <input
                                    id="logo-file-input"
                                    type="file"
                                    accept="image/png"
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            handleLogoFileSelect(e.target.files[0]);
                                        }
                                    }}
                                />
                                <ImageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                <Typography variant="h6" gutterBottom>
                                    {dragActive ? 'Drop file here' : 'Drag and drop logo here'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    or click to browse (PNG only)
                                </Typography>
                            </Box>

                            {logoPreview && (
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Preview:
                                    </Typography>
                                    <img
                                        src={logoPreview}
                                        alt="Logo Preview"
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '200px',
                                            objectFit: 'contain',
                                        }}
                                    />
                                </Box>
                            )}
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setLogoModalOpen(false)} disabled={logoUploading}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleLogoUpload}
                            disabled={!logoFile || logoUploading}
                            startIcon={logoUploading ? <CircularProgress size={20} /> : <CloudUpload />}
                        >
                            {logoUploading ? 'Uploading...' : 'Upload'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
}
