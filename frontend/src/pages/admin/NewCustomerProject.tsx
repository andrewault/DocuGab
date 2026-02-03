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
    Tabs,
    Tab,
    Divider,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { Add, Palette, Settings, Description } from '@mui/icons-material';
import { getAuthHeader } from '../../utils/authUtils';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

interface ProjectFormData {
    customer_id: number | '';
    name: string;
    slug: string;
    description: string;
    logo: string;
    title: string;
    subtitle: string;
    body: string;
    color_primary: string;
    color_secondary: string;
    color_background: string;
    avatar: string;
    voice: string;
    return_link: string;
    return_link_text: string;
}

const DEFAULT_FORM_DATA: ProjectFormData = {
    customer_id: '',
    name: '',
    slug: '',
    description: '',
    logo: '',
    title: '',
    subtitle: '',
    body: '',
    color_primary: '#1976d2',
    color_secondary: '#dc004e',
    color_background: '#ffffff',
    avatar: '/assets/avatars/default.glb',
    voice: 'en-US-Neural2-F',
    return_link: '',
    return_link_text: '',
};

interface Customer {
    id: number;
    uuid: string;
    name: string;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div hidden={value !== index} {...other} style={{ width: '100%' }}>
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    );
}

export default function NewCustomerProject() {
    const { uuid: customerUuid } = useParams<{ uuid: string }>();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [formData, setFormData] = useState<ProjectFormData>(DEFAULT_FORM_DATA);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [tabValue, setTabValue] = useState(0);

    useEffect(() => {
        const fetchCustomer = async () => {
            try {
                if (!customerUuid) throw new Error('Customer UUID is missing');

                const response = await fetch(`${API_BASE}/api/v1/admin/customers/${customerUuid}`, {
                    headers: getAuthHeader(),
                });

                if (!response.ok) throw new Error('Failed to fetch customer');

                const data = await response.json();
                setCustomer(data);
                setFormData(prev => ({ ...prev, customer_id: data.id }));
            } catch (err) {
                console.error('Failed to load customer:', err);
                setError('Failed to load customer details');
            } finally {
                setLoading(false);
            }
        };

        fetchCustomer();
    }, [customerUuid]);

    const handleChange = (field: keyof ProjectFormData, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const isFormValid = () => {
        return (
            formData.customer_id !== '' &&
            formData.name.trim() !== '' &&
            formData.slug.trim() !== '' &&
            formData.title.trim() !== '' &&
            formData.avatar.trim() !== '' &&
            formData.voice.trim() !== ''
        );
    };

    const handleSubmit = async () => {
        if (!isFormValid()) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            const response = await fetch(`${API_BASE}/api/v1/admin/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader(),
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Failed to create project');
            }

            const newProject = await response.json();
            // Navigate back to customer detail page or new project page? 
            // Usually simpler to go to the project detail page.
            navigate(`/admin/projects/${newProject.uuid}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create project');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!customer) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="error">Customer not found</Alert>
                <Button onClick={() => navigate('/admin/customers')} sx={{ mt: 2 }}>
                    Back to Customers
                </Button>
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
                <AdminBreadcrumbs items={[
                    { label: 'Customers', path: '/admin/customers' },
                    { label: customer.name, path: `/admin/customers/${customerUuid}` },
                    { label: 'New Project' }
                ]} />

                {/* Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Add sx={{ fontSize: 32, color: '#6366f1' }} />
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
                            New Chatbot Project
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="outlined"
                            onClick={() => navigate(`/admin/customers/${customerUuid}`)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={handleSubmit}
                            disabled={saving || !isFormValid()}
                        >
                            {saving ? 'Creating...' : 'Create Project'}
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

                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                        <Tabs value={tabValue} onChange={(_e, newValue) => setTabValue(newValue)}>
                            <Tab label="Basic Info" icon={<Description />} iconPosition="start" />
                            <Tab label="Branding" icon={<Palette />} iconPosition="start" />
                            <Tab label="Configuration" icon={<Settings />} iconPosition="start" />
                        </Tabs>
                    </Box>

                    {/* Tab 0: Basic Info */}
                    <TabPanel value={tabValue} index={0}>
                        <Stack spacing={3} maxWidth="md">
                            <FormControl fullWidth disabled>
                                <InputLabel>Customer</InputLabel>
                                <Select
                                    value={formData.customer_id}
                                    label="Customer"
                                >
                                    <MenuItem value={customer.id}>{customer.name}</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                label="Project Name"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                required
                                helperText="e.g., Employee Handbook"
                            />

                            <TextField
                                fullWidth
                                label="Slug"
                                value={formData.slug}
                                onChange={(e) => handleChange('slug', e.target.value)}
                                required
                                helperText="URL-friendly identifier (lowercase, hyphens only)"
                            />

                            <TextField
                                fullWidth
                                label="Description"
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                multiline
                                rows={4}
                            />
                        </Stack>
                    </TabPanel>

                    {/* Tab 1: Branding */}
                    <TabPanel value={tabValue} index={1}>
                        <Stack spacing={3} maxWidth="md">
                            <TextField
                                fullWidth
                                label="Chat Interface Title"
                                value={formData.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                required
                            />

                            <TextField
                                fullWidth
                                label="Subtitle"
                                value={formData.subtitle}
                                onChange={(e) => handleChange('subtitle', e.target.value)}
                            />

                            <TextField
                                fullWidth
                                label="Body Text"
                                value={formData.body}
                                onChange={(e) => handleChange('body', e.target.value)}
                                multiline
                                rows={3}
                                helperText="Additional instructions or welcome message"
                            />

                            <Divider sx={{ my: 2 }} >
                                <Typography variant="caption" color="textSecondary">COLORS</Typography>
                            </Divider>

                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                                <TextField
                                    fullWidth
                                    type="color"
                                    label="Primary Color"
                                    value={formData.color_primary}
                                    onChange={(e) => handleChange('color_primary', e.target.value)}
                                    required
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    fullWidth
                                    type="color"
                                    label="Secondary Color"
                                    value={formData.color_secondary}
                                    onChange={(e) => handleChange('color_secondary', e.target.value)}
                                    required
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    fullWidth
                                    type="color"
                                    label="Background Color"
                                    value={formData.color_background}
                                    onChange={(e) => handleChange('color_background', e.target.value)}
                                    required
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Stack>

                            <TextField
                                fullWidth
                                label="Logo URL"
                                value={formData.logo}
                                onChange={(e) => handleChange('logo', e.target.value)}
                                helperText="Path to logo file (optional)"
                            />
                        </Stack>
                    </TabPanel>

                    {/* Tab 2: Configuration */}
                    <TabPanel value={tabValue} index={2}>
                        <Stack spacing={3} maxWidth="md">
                            <TextField
                                fullWidth
                                label="Avatar 3D Model URL"
                                value={formData.avatar}
                                onChange={(e) => handleChange('avatar', e.target.value)}
                                required
                                helperText="Path to GLB avatar file"
                            />

                            <TextField
                                fullWidth
                                label="Voice ID"
                                value={formData.voice}
                                onChange={(e) => handleChange('voice', e.target.value)}
                                required
                                helperText="Google TTS voice ID (e.g., en-US-Neural2-F)"
                            />

                            <Divider sx={{ my: 2 }} >
                                <Typography variant="caption" color="textSecondary">RETURN LINK</Typography>
                            </Divider>

                            <TextField
                                fullWidth
                                label="Return Link URL"
                                value={formData.return_link}
                                onChange={(e) => handleChange('return_link', e.target.value)}
                                helperText="Optional return link override"
                            />

                            <TextField
                                fullWidth
                                label="Return Link Text"
                                value={formData.return_link_text}
                                onChange={(e) => handleChange('return_link_text', e.target.value)}
                                helperText="Text for return link button"
                            />
                        </Stack>
                    </TabPanel>

                </Paper>
            </Container>
        </Box>
    );
}
