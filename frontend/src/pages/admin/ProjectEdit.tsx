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
    Tabs,
    Tab,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Switch,
    FormControlLabel,
    Chip,
} from '@mui/material';
import { Save, CloudUpload, Image as ImageIcon, VolumeUp } from '@mui/icons-material';
import { getAuthHeader } from '../../utils/authUtils';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';
import { StatusBanner } from '../../components/admin/StatusBanner';
import { VOICE_OPTIONS, VOICE_TEST_TEXT } from '../../constants/voiceConstants';
import { API_BASE } from '@/config/api';

interface Project {
    id: number;
    customer_id: number;
    name: string;
    slug: string;
    description: string | null;
    subdomain: string;
    logo: string | null;
    title: string;
    subtitle: string | null;
    body: string | null;
    color_primary: string;
    color_secondary: string;
    color_background: string;
    avatar: string;
    voice: string;
    show_animation: boolean;
    return_link: string | null;
    return_link_text: string | null;
    is_active: boolean;
    is_demo: boolean;
    is_enabled: boolean;
    is_ready: boolean;
    documents_count: number;
    customer_name: string | null;
}

interface Customer {
    id: number;
    name: string;
}

interface ProjectFormData {
    customer_id: number | '';
    name: string;
    slug: string;
    description: string;
    subdomain: string;
    logo: string;
    title: string;
    subtitle: string;
    body: string;
    color_primary: string;
    color_secondary: string;
    color_background: string;
    avatar: string;
    voice: string;
    show_animation: boolean;
    return_link: string;
    return_link_text: string;
    is_demo: boolean;
    is_enabled: boolean;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div hidden={value !== index} {...other}>
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    );
}

export default function ProjectEdit() {
    const { uuid } = useParams<{ uuid: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [logoModalOpen, setLogoModalOpen] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoUploading, setLogoUploading] = useState(false);
    const [testingVoice, setTestingVoice] = useState(false);
    const [logoError, setLogoError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [currentLogo, setCurrentLogo] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [project, setProject] = useState<Project | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [tabValue, setTabValue] = useState(0);
    const [formData, setFormData] = useState<ProjectFormData>({
        customer_id: '',
        name: '',
        slug: '',
        description: '',
        subdomain: '',
        logo: '',
        title: '',
        subtitle: '',
        body: '',
        color_primary: '#1976d2',
        color_secondary: '#dc004e',
        color_background: '#ffffff',
        avatar: 'male',
        voice: 'alloy',
        show_animation: true,
        return_link: '',
        return_link_text: '',
        is_demo: false,
        is_enabled: true,
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch project
                const projectResponse = await fetch(
                    `${API_BASE}/api/v1/admin/projects/${uuid}`,
                    { headers: getAuthHeader() }
                );
                if (!projectResponse.ok) throw new Error('Failed to fetch project');
                const projectData = await projectResponse.json();
                setProject(projectData);

                // Populate form
                setFormData({
                    customer_id: projectData.customer_id,
                    name: projectData.name,
                    slug: projectData.slug,
                    description: projectData.description || '',
                    subdomain: projectData.subdomain,
                    logo: projectData.logo || '',
                    title: projectData.title,
                    subtitle: projectData.subtitle || '',
                    body: projectData.body || '',
                    color_primary: projectData.color_primary,
                    color_secondary: projectData.color_secondary,
                    color_background: projectData.color_background,
                    avatar: projectData.avatar,
                    voice: projectData.voice,
                    show_animation: projectData.show_animation ?? true,
                    return_link: projectData.return_link || '',
                    return_link_text: projectData.return_link_text || '',
                    is_demo: projectData.is_demo || false,
                    is_enabled: projectData.is_enabled ?? true,
                });
                setCurrentLogo(projectData.logo);

                // Fetch customers
                const customersResponse = await fetch(
                    `${API_BASE}/api/v1/admin/customers?per_page=100`,
                    { headers: getAuthHeader() }
                );
                if (!customersResponse.ok) throw new Error('Failed to fetch customers');
                const customersData = await customersResponse.json();
                setCustomers(customersData.customers);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [uuid]);

    const handleSave = async () => {
        if (!formData.name || !formData.customer_id) {
            setSaveError('Name and customer are required');
            return;
        }

        setSaving(true);
        setSaveError(null);
        try {
            const response = await fetch(
                `${API_BASE}/api/v1/admin/projects/${uuid}`,
                {
                    method: 'PATCH',
                    headers: {
                        ...getAuthHeader(),
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to update project');
            }

            navigate(`/admin/projects/${uuid}`);
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Failed to update project');
        } finally {
            setSaving(false);
        }
    };

    const handleLogoFileSelect = (file: File) => {
        if (file.type !== 'image/png') {
            setLogoError('Only PNG files are allowed');
            return;
        }
        setLogoError(null);
        setLogoFile(file);
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
            const response = await fetch(`${API_BASE}/api/v1/admin/projects/${uuid}/logo`, {
                method: 'POST',
                headers: getAuthHeader(),
                body: formData,
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Failed to upload logo');
            }
            setCurrentLogo(`/api/v1/admin/projects/${uuid}/logo?t=${Date.now()}`);
            setLogoModalOpen(false);
            setLogoFile(null);
            setLogoPreview(null);
        } catch (err) {
            setLogoError(err instanceof Error ? err.message : 'Failed to upload logo');
        } finally {
            setLogoUploading(false);
        }
    };

    const testVoice = async (voice: string) => {
        setTestingVoice(true);
        try {
            const res = await fetch(`${API_BASE}/api/v1/speech/synthesize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: VOICE_TEST_TEXT, voice }),
            });

            if (res.ok) {
                const audioBlob = await res.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);

                audio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                };

                audio.play();
            }
        } catch (error) {
            console.error('Voice test error:', error);
        } finally {
            setTestingVoice(false);
        }
    };

    if (loading) {
        return (
            <Container maxWidth={false} sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (error || !project) {
        return (
            <Container maxWidth={false} sx={{ mt: 4 }}>
                <Alert severity="error">{error || 'Project not found'}</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: 3 }}>
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
                    { label: 'Projects', path: '/admin/projects' },
                    { label: project.name, path: `/admin/projects/${uuid}` },
                    { label: 'Edit' },
                ]}
            />

            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                <Stack direction="row" spacing={2} alignItems="center">
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
                        Edit Project
                    </Typography>
                    {project.is_ready ? (
                        <Chip
                            label="Ready"
                            sx={{
                                backgroundColor: '#4caf50',
                                color: 'white',
                                fontWeight: 600,
                            }}
                        />
                    ) : (
                        <Chip
                            label="Not Ready"
                            sx={{
                                backgroundColor: '#f44336',
                                color: 'white',
                                fontWeight: 600,
                            }}
                        />
                    )}
                </Stack>
                <Stack direction="row" spacing={2}>
                    <Button
                        variant="outlined"
                        onClick={() => navigate(`/admin/projects/${uuid}`)}
                        disabled={saving}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </Stack>
            </Stack>

            {saveError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {saveError}
                </Alert>
            )}

            <Paper elevation={2} sx={{ p: 3 }}>
                <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }}>
                    <Tab label="Basic Info" />
                    <Tab label="Branding" />
                    <Tab label="Avatar & Voice" />
                </Tabs>

                <TabPanel value={tabValue} index={0}>
                    <Stack spacing={3}>
                        <FormControl fullWidth required>
                            <InputLabel>Customer</InputLabel>
                            <Select
                                value={formData.customer_id}
                                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value as number })}
                                label="Customer"
                                disabled={saving}
                            >
                                {customers.map((customer) => (
                                    <MenuItem key={customer.id} value={customer.id}>
                                        {customer.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Project Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSave();
                                }
                            }}
                            fullWidth
                            required
                            disabled={saving}
                        />

                        <TextField
                            label="Slug"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSave();
                                }
                            }}
                            fullWidth
                            helperText="URL-friendly identifier"
                            disabled={saving}
                        />

                        <TextField
                            label="Description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            fullWidth
                            multiline
                            rows={3}
                            disabled={saving}
                        />

                        <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.is_enabled}
                                        onChange={(e) => {
                                            // Only allow enabling if project is ready
                                            if (e.target.checked && project && !project.is_ready) {
                                                return;
                                            }
                                            setFormData({ ...formData, is_enabled: e.target.checked });
                                        }}
                                        disabled={saving || (project && !project.is_ready && !formData.is_enabled)}
                                        color="primary"
                                    />
                                }
                                label="Enabled"
                            />
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                                Controls whether this project is enabled and available for use.
                                {project && !project.is_ready && (
                                    <>
                                        <br />
                                        <strong>Note:</strong> Project must be ready (have avatar, voice, and documents) before it can be enabled.
                                    </>
                                )}
                            </Typography>
                        </Box>

                        <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.is_demo}
                                        onChange={(e) => setFormData({ ...formData, is_demo: e.target.checked })}
                                        disabled={saving}
                                        color="secondary"
                                    />
                                }
                                label="Demo Project"
                            />
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                                Warning: Designates this as the public demo project.
                                Only one project can be the demo at a time.
                            </Typography>
                        </Box>

                        <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.show_animation}
                                        onChange={(e) => setFormData({ ...formData, show_animation: e.target.checked })}
                                        disabled={saving}
                                        color="primary"
                                    />
                                }
                                label="Show Animation"
                            />
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                                When disabled, projects don't require animations to be marked as ready.
                                Only documents will be required.
                            </Typography>
                        </Box>
                    </Stack>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <Stack spacing={3}>
                        <TextField
                            label="Title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSave();
                                }
                            }}
                            fullWidth
                            disabled={saving}
                        />

                        <TextField
                            label="Subtitle"
                            value={formData.subtitle}
                            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSave();
                                }
                            }}
                            fullWidth
                            disabled={saving}
                        />

                        <TextField
                            label="Body Text"
                            value={formData.body}
                            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                            fullWidth
                            multiline
                            rows={4}
                            disabled={saving}
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
                                disabled={saving}
                            >
                                {currentLogo ? 'Replace Logo' : 'Upload Logo'}
                            </Button>
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" gutterBottom>
                                Colors
                            </Typography>
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    label="Primary Color"
                                    type="color"
                                    value={formData.color_primary}
                                    onChange={(e) => setFormData({ ...formData, color_primary: e.target.value })}
                                    fullWidth
                                    disabled={saving}
                                />
                                <TextField
                                    label="Secondary Color"
                                    type="color"
                                    value={formData.color_secondary}
                                    onChange={(e) => setFormData({ ...formData, color_secondary: e.target.value })}
                                    fullWidth
                                    disabled={saving}
                                />
                                <TextField
                                    label="Background Color"
                                    type="color"
                                    value={formData.color_background}
                                    onChange={(e) => setFormData({ ...formData, color_background: e.target.value })}
                                    fullWidth
                                    disabled={saving}
                                />
                            </Stack>
                        </Box>

                        <TextField
                            label="Return Link"
                            value={formData.return_link}
                            onChange={(e) => setFormData({ ...formData, return_link: e.target.value })}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSave();
                                }
                            }}
                            fullWidth
                            disabled={saving}
                        />

                        <TextField
                            label="Return Link Text"
                            value={formData.return_link_text}
                            onChange={(e) => setFormData({ ...formData, return_link_text: e.target.value })}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSave();
                                }
                            }}
                            fullWidth
                            disabled={saving}
                        />
                    </Stack>
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                    <Stack spacing={3}>
                        <FormControl fullWidth>
                            <InputLabel>Avatar</InputLabel>
                            <Select
                                value={formData.avatar}
                                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                                label="Avatar"
                                disabled={saving}
                            >
                                <MenuItem value="male">Male</MenuItem>
                                <MenuItem value="female">Female</MenuItem>
                            </Select>
                        </FormControl>

                        <Stack direction="row" spacing={2} alignItems="flex-start">
                            <FormControl fullWidth>
                                <InputLabel>Voice Assistant</InputLabel>
                                <Select
                                    value={formData.voice}
                                    onChange={(e) => setFormData({ ...formData, voice: e.target.value })}
                                    label="Voice Assistant"
                                    disabled={saving}
                                >
                                    {VOICE_OPTIONS.map((voice) => (
                                        <MenuItem key={voice.value} value={voice.value}>
                                            {voice.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Button
                                variant="outlined"
                                startIcon={<VolumeUp />}
                                onClick={() => testVoice(formData.voice)}
                                disabled={saving || testingVoice}
                                sx={{ minWidth: 100, height: 56 }}
                            >
                                Test
                            </Button>
                        </Stack>
                    </Stack>
                </TabPanel>
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
                            onClick={() => document.getElementById('admin-logo-input')?.click()}
                        >
                            <input
                                id="admin-logo-input"
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
    );
}
