import { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    TextField,
    Stack,
    Button,
    CircularProgress,
    Alert,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Tabs,
    Tab,
    Card,
    CardContent,
    useTheme,
} from '@mui/material';
import { Add, Edit, Delete, Folder, Palette } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getAuthHeader } from '../../utils/authUtils';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';

interface Project {
    id: number;
    uuid: string;
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
    created_at: string;
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

const DEFAULT_FORM_DATA: ProjectFormData = {
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
    avatar: '/assets/avatars/default.glb',
    voice: 'en-US-Neural2-F',
    return_link: '',
    return_link_text: '',
};

export default function Projects() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [customerFilter, setCustomerFilter] = useState<number | ''>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [formData, setFormData] = useState<ProjectFormData>(DEFAULT_FORM_DATA);
    const [tabValue, setTabValue] = useState(0);

    const fetchCustomers = useCallback(async () => {
        try {
            const response = await fetch(
                `${API_BASE}/api/admin/customers?per_page=1000`,
                { headers: getAuthHeader() }
            );
            if (!response.ok) throw new Error('Failed to fetch customers');
            const data = await response.json();
            setCustomers(data.customers);
        } catch (err) {
            console.error('Failed to load customers:', err);
        }
    }, []);

    const fetchProjects = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: String(page + 1),
                per_page: String(rowsPerPage),
                ...(search && { search }),
                ...(customerFilter && { customer_id: String(customerFilter) }),
            });

            const response = await fetch(
                `${API_BASE}/api/admin/projects?${params}`,
                { headers: getAuthHeader() }
            );

            if (!response.ok) throw new Error('Failed to fetch projects');

            const data = await response.json();
            setProjects(data.projects);
            setTotal(data.total);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load projects');
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, search, customerFilter]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const handlePageChange = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleOpenDialog = (project?: Project) => {
        if (project) {
            setEditingProject(project);
            setFormData({
                customer_id: project.customer_id,
                name: project.name,
                slug: project.slug,
                description: project.description || '',
                subdomain: project.subdomain,
                logo: project.logo || '',
                title: project.title,
                subtitle: project.subtitle || '',
                body: project.body || '',
                color_primary: project.color_primary,
                color_secondary: project.color_secondary,
                color_background: project.color_background,
                avatar: project.avatar,
                voice: project.voice,
                return_link: project.return_link || '',
                return_link_text: project.return_link_text || '',
            });
        } else {
            setEditingProject(null);
            setFormData(DEFAULT_FORM_DATA);
        }
        setTabValue(0);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingProject(null);
        setTabValue(0);
    };

    const handleSubmit = async () => {
        try {
            const url = editingProject
                ? `${API_BASE}/api/admin/projects/${editingProject.id}`
                : `${API_BASE}/api/admin/projects`;

            const method = editingProject ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    ...getAuthHeader(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to save project');
            }

            handleCloseDialog();
            fetchProjects();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save project');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this project? This will also delete all associated documents.')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/api/admin/projects/${id}`, {
                method: 'DELETE',
                headers: getAuthHeader(),
            });

            if (!response.ok) throw new Error('Failed to delete project');

            fetchProjects();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete project');
        }
    };

    const isFormValid = () => {
        return (
            formData.customer_id !== '' &&
            formData.name.trim() !== '' &&
            formData.slug.trim() !== '' &&
            formData.subdomain.trim() !== '' &&
            formData.title.trim() !== '' &&
            formData.avatar.trim() !== '' &&
            formData.voice.trim() !== ''
        );
    };

    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const StatCard = ({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) => (
        <Card sx={{ bgcolor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'background.paper' }}>
            <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Box>
                        <Typography color="text.secondary" variant="body2">
                            {title}
                        </Typography>
                        <Typography variant="h4" fontWeight={700}>
                            {value}
                        </Typography>
                    </Box>
                    <Box sx={{ color: 'primary.main', opacity: 0.7 }}>{icon}</Box>
                </Stack>
            </CardContent>
        </Card>
    );

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
                <AdminBreadcrumbs items={[{ label: 'Projects' }]} />

                {/* Header with Title and Add Button */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
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
                        Projects
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                    >
                        Add Project
                    </Button>
                </Stack>

                {/* Stats Cards */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, 1fr)' },
                        gap: 3,
                        mb: 4,
                    }}
                >
                    <StatCard title="Total Projects" value={total} icon={<Folder sx={{ fontSize: 40 }} />} />
                    <StatCard
                        title="Active Projects"
                        value={projects.filter(p => p.is_active).length}
                        icon={<Folder sx={{ fontSize: 40 }} />}
                    />
                    <StatCard
                        title="Documents"
                        value={projects.reduce((sum, p) => sum + p.documents_count, 0)}
                        icon={<Folder sx={{ fontSize: 40 }} />}
                    />
                </Box>

                <Box sx={{ mb: 4 }}>
                    <Stack direction="row" spacing={2} mb={3}>
                        <TextField
                            fullWidth
                            label="Search projects"
                            variant="outlined"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(0);
                            }}
                        />
                        <FormControl sx={{ minWidth: 200 }}>
                            <InputLabel>Filter by Customer</InputLabel>
                            <Select
                                value={customerFilter}
                                label="Filter by Customer"
                                onChange={(e) => {
                                    setCustomerFilter(e.target.value as number | '');
                                    setPage(0);
                                }}
                            >
                                <MenuItem value="">All Customers</MenuItem>
                                {customers.map((customer) => (
                                    <MenuItem key={customer.id} value={customer.id}>
                                        {customer.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    {loading ? (
                        <Box display="flex" justifyContent="center" py={8}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Paper elevation={2}>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Name</TableCell>
                                            <TableCell>Customer</TableCell>
                                            <TableCell>Subdomain</TableCell>
                                            <TableCell>Title</TableCell>
                                            <TableCell>Documents</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell align="right">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {projects.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center">
                                                    <Typography color="textSecondary" py={4}>
                                                        No projects found
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            projects.map((project) => (
                                                <TableRow
                                                    key={project.id}
                                                    hover
                                                    sx={{ cursor: 'pointer' }}
                                                    onClick={() => navigate(`/admin/projects/${project.uuid}`)}
                                                >
                                                    <TableCell>
                                                        <Typography fontWeight={500}>
                                                            {project.name}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            {project.slug}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        {project.customer_name || '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={project.subdomain}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{
                                                                fontFamily: 'monospace',
                                                                fontSize: '0.75rem',
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        {project.title}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={project.documents_count}
                                                            size="small"
                                                            color="primary"
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={project.is_active ? 'Active' : 'Inactive'}
                                                            color={project.is_active ? 'success' : 'default'}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/admin/projects/${project.uuid}/edit`);
                                                            }}
                                                            color="primary"
                                                        >
                                                            <Edit />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(project.id);
                                                            }}
                                                            color="error"
                                                        >
                                                            <Delete />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                component="div"
                                count={total}
                                page={page}
                                onPageChange={handlePageChange}
                                rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={handleRowsPerPageChange}
                                rowsPerPageOptions={[5, 10, 25, 50]}
                            />
                        </Paper>
                    )}
                </Box>

                {/* Create/Edit Dialog */}
                <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                    <DialogTitle>
                        {editingProject ? 'Edit Project' : 'Add Project'}
                    </DialogTitle>
                    <DialogContent>
                        <Tabs value={tabValue} onChange={(_e, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
                            <Tab label="Basic Info" />
                            <Tab label="Branding" icon={<Palette />} iconPosition="start" />
                            <Tab label="Advanced" />
                        </Tabs>

                        {/* Tab 0: Basic Info */}
                        <TabPanel value={tabValue} index={0}>
                            <Stack spacing={3}>
                                <FormControl fullWidth required>
                                    <InputLabel>Customer</InputLabel>
                                    <Select
                                        value={formData.customer_id}
                                        label="Customer"
                                        onChange={(e) => setFormData({ ...formData, customer_id: e.target.value as number })}
                                    >
                                        {customers.map((customer) => (
                                            <MenuItem key={customer.id} value={customer.id}>
                                                {customer.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <TextField
                                    fullWidth
                                    label="Project Name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    helperText="e.g., Employee Handbook"
                                />

                                <TextField
                                    fullWidth
                                    label="Slug"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    required
                                    helperText="URL-friendly identifier (lowercase, hyphens only)"
                                />

                                <TextField
                                    fullWidth
                                    label="Subdomain"
                                    value={formData.subdomain}
                                    onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                                    required
                                    helperText="Unique subdomain (lowercase, hyphens only)"
                                />

                                <TextField
                                    fullWidth
                                    label="Description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    multiline
                                    rows={2}
                                />
                            </Stack>
                        </TabPanel>

                        {/* Tab 1: Branding */}
                        <TabPanel value={tabValue} index={1}>
                            <Stack spacing={3}>
                                <TextField
                                    fullWidth
                                    label="Title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    helperText="Chat interface title"
                                />

                                <TextField
                                    fullWidth
                                    label="Subtitle"
                                    value={formData.subtitle}
                                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                    helperText="Optional subtitle"
                                />

                                <TextField
                                    fullWidth
                                    label="Body Text"
                                    value={formData.body}
                                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                    multiline
                                    rows={3}
                                    helperText="Additional instructions or information"
                                />

                                <Stack direction="row" spacing={2}>
                                    <TextField
                                        fullWidth
                                        type="color"
                                        label="Primary Color"
                                        value={formData.color_primary}
                                        onChange={(e) => setFormData({ ...formData, color_primary: e.target.value })}
                                        required
                                    />
                                    <TextField
                                        fullWidth
                                        type="color"
                                        label="Secondary Color"
                                        value={formData.color_secondary}
                                        onChange={(e) => setFormData({ ...formData, color_secondary: e.target.value })}
                                        required
                                    />
                                    <TextField
                                        fullWidth
                                        type="color"
                                        label="Background Color"
                                        value={formData.color_background}
                                        onChange={(e) => setFormData({ ...formData, color_background: e.target.value })}
                                        required
                                    />
                                </Stack>

                                <TextField
                                    fullWidth
                                    label="Logo Path"
                                    value={formData.logo}
                                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                                    helperText="Path to logo file (optional)"
                                />
                            </Stack>
                        </TabPanel>

                        {/* Tab 2: Advanced */}
                        <TabPanel value={tabValue} index={2}>
                            <Stack spacing={3}>
                                <TextField
                                    fullWidth
                                    label="Avatar Path"
                                    value={formData.avatar}
                                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                                    required
                                    helperText="Path to GLB avatar file"
                                />

                                <TextField
                                    fullWidth
                                    label="Voice ID"
                                    value={formData.voice}
                                    onChange={(e) => setFormData({ ...formData, voice: e.target.value })}
                                    required
                                    helperText="Google TTS voice ID (e.g., en-US-Neural2-F)"
                                />

                                <TextField
                                    fullWidth
                                    label="Return Link URL"
                                    value={formData.return_link}
                                    onChange={(e) => setFormData({ ...formData, return_link: e.target.value })}
                                    helperText="Optional return link override"
                                />

                                <TextField
                                    fullWidth
                                    label="Return Link Text"
                                    value={formData.return_link_text}
                                    onChange={(e) => setFormData({ ...formData, return_link_text: e.target.value })}
                                    helperText="Text for return link button"
                                />
                            </Stack>
                        </TabPanel>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button
                            onClick={handleSubmit}
                            variant="contained"
                            disabled={!isFormValid()}
                        >
                            {editingProject ? 'Update' : 'Create'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container >
        </Box >
    );
}
