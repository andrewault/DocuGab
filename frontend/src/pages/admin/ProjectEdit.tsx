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
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { getAuthHeader } from '../../utils/authUtils';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';

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
    return_link: string | null;
    return_link_text: string | null;
    is_active: boolean;
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
    return_link: string;
    return_link_text: string;
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

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

export default function ProjectEdit() {
    const { uuid } = useParams<{ uuid: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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
        return_link: '',
        return_link_text: '',
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch project
                const projectResponse = await fetch(
                    `${API_BASE}/api/admin/projects/${uuid}`,
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
                    return_link: projectData.return_link || '',
                    return_link_text: projectData.return_link_text || '',
                });

                // Fetch customers
                const customersResponse = await fetch(
                    `${API_BASE}/api/admin/customers?per_page=100`,
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
                `${API_BASE}/api/admin/projects/${uuid}`,
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
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <AdminBreadcrumbs
                items={[
                    { label: 'Projects', path: '/admin/projects' },
                    { label: project.name, path: `/admin/projects/${uuid}` },
                    { label: 'Edit' },
                ]}
            />

            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4">Edit Project</Typography>
                <Stack direction="row" spacing={2}>
                    <Button
                        startIcon={<ArrowBack />}
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
                            fullWidth
                            required
                            disabled={saving}
                        />

                        <TextField
                            label="Slug"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            fullWidth
                            helperText="URL-friendly identifier"
                            disabled={saving}
                        />

                        <TextField
                            label="Subdomain"
                            value={formData.subdomain}
                            onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                            fullWidth
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
                    </Stack>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <Stack spacing={3}>
                        <TextField
                            label="Title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            fullWidth
                            disabled={saving}
                        />

                        <TextField
                            label="Subtitle"
                            value={formData.subtitle}
                            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
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

                        <TextField
                            label="Logo URL"
                            value={formData.logo}
                            onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                            fullWidth
                            disabled={saving}
                        />

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
                            fullWidth
                            disabled={saving}
                        />

                        <TextField
                            label="Return Link Text"
                            value={formData.return_link_text}
                            onChange={(e) => setFormData({ ...formData, return_link_text: e.target.value })}
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

                        <FormControl fullWidth>
                            <InputLabel>Voice</InputLabel>
                            <Select
                                value={formData.voice}
                                onChange={(e) => setFormData({ ...formData, voice: e.target.value })}
                                label="Voice"
                                disabled={saving}
                            >
                                <MenuItem value="alloy">Alloy</MenuItem>
                                <MenuItem value="echo">Echo</MenuItem>
                                <MenuItem value="fable">Fable</MenuItem>
                                <MenuItem value="onyx">Onyx</MenuItem>
                                <MenuItem value="nova">Nova</MenuItem>
                                <MenuItem value="shimmer">Shimmer</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </TabPanel>
            </Paper>
        </Container>
    );
}
