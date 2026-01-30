import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Paper,
    Chip,
    CircularProgress,
    Alert,
    Button,
    Stack,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControlLabel,
    Switch,
} from '@mui/material';
import {
    Business,
    Phone,
    Person,
    CalendarToday,
    ArrowBack,
    Add,
    Folder,
    Edit,
} from '@mui/icons-material';
import { getAuthHeader } from '../../utils/authUtils';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';
import { useAuth } from '../../context/AuthContext';
import { formatInUserTimezone } from '../../utils/timezoneUtils';

interface Customer {
    id: number;
    uuid: string;
    name: string;
    contact_name: string | null;
    contact_phone: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    projects_count: number;
}

interface Project {
    id: number;
    uuid: string;
    name: string;
    subdomain: string;
    is_active: boolean;
    created_at: string;
    documents_count: number;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

export default function CustomerDetail() {
    const { user: currentUser } = useAuth();
    const { uuid } = useParams<{ uuid: string }>();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', contact_name: '', contact_phone: '', is_active: true });
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch customer details
                const customerResponse = await fetch(
                    `${API_BASE}/api/admin/customers/${uuid}`,
                    { headers: getAuthHeader() }
                );

                if (!customerResponse.ok) {
                    throw new Error('Failed to fetch customer');
                }

                const customerData = await customerResponse.json();
                setCustomer(customerData);

                // Fetch customer's projects using the customer's integer ID
                const projectsResponse = await fetch(
                    `${API_BASE}/api/admin/projects?customer_id=${customerData.id}`,
                    { headers: getAuthHeader() }
                );

                if (!projectsResponse.ok) {
                    throw new Error('Failed to fetch projects');
                }

                const projectsData = await projectsResponse.json();
                setProjects(projectsData.projects || []);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        if (uuid) {
            fetchData();
        }
    }, [uuid]);

    if (loading) {
        return (
            <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: 3 }}>
                <Box display="flex" justifyContent="center" py={8}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error || !customer) {
        return (
            <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: 3 }}>
                <Alert severity="error">{error || 'Customer not found'}</Alert>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/admin/customers')}
                    sx={{ mt: 2 }}
                >
                    Back to Customers
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: 3 }}>
            <AdminBreadcrumbs
                items={[
                    { label: 'Customers', path: '/admin/customers' },
                    { label: customer.name },
                ]}
            />

            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" component="h1">
                    <Business sx={{ mr: 1, verticalAlign: 'bottom' }} />
                    {customer.name}
                </Typography>
                <Stack direction="row" spacing={2}>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        onClick={() => navigate('/admin/customers')}
                    >
                        Back
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Edit />}
                        onClick={() => {
                            if (customer) {
                                setEditForm({
                                    name: customer.name,
                                    contact_name: customer.contact_name || '',
                                    contact_phone: customer.contact_phone || '',
                                    is_active: customer.is_active,
                                });
                                setEditDialogOpen(true);
                                setSaveError(null);
                            }
                        }}
                    >
                        Edit Customer
                    </Button>
                </Stack>
            </Stack>

            {/* Customer Details */}
            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Customer Details
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
                    <Box sx={{ flex: 1 }}>
                        <Stack spacing={2}>
                            <Box>
                                <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                                    <Business fontSize="small" />
                                    Customer Name
                                </Typography>
                                <Typography variant="body1" fontWeight={500}>
                                    {customer.name}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                                    <Person fontSize="small" />
                                    Contact Name
                                </Typography>
                                <Typography variant="body1">
                                    {customer.contact_name || '—'}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                                    <Phone fontSize="small" />
                                    Contact Phone
                                </Typography>
                                <Typography variant="body1">
                                    {customer.contact_phone || '—'}
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>

                    <Box sx={{ flex: 1 }}>
                        <Stack spacing={2}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Status
                                </Typography>
                                <Box>
                                    <Chip
                                        label={customer.is_active ? 'Active' : 'Inactive'}
                                        color={customer.is_active ? 'success' : 'default'}
                                        size="small"
                                    />
                                </Box>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                                    <CalendarToday fontSize="small" />
                                    Created
                                </Typography>
                                <Typography variant="body1">
                                    {formatInUserTimezone(
                                        customer.created_at,
                                        currentUser?.timezone || 'America/Los_Angeles',
                                        'PP'
                                    )}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Total Projects
                                </Typography>
                                <Typography variant="body1" fontWeight={500}>
                                    {customer.projects_count}
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>
                </Stack>
            </Paper>

            {/* Projects List */}
            <Paper elevation={2} sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6">
                        Projects ({projects.length})
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => navigate('/admin/projects')}
                    >
                        Add Project
                    </Button>
                </Stack>

                {projects.length === 0 ? (
                    <Box py={4} textAlign="center">
                        <Typography color="text.secondary">
                            No projects yet. Create a project for this customer.
                        </Typography>
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Subdomain</TableCell>
                                    <TableCell>Documents</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Created</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {projects.map((project) => (
                                    <TableRow
                                        key={project.id}
                                        hover
                                        sx={{ cursor: 'pointer' }}
                                        onClick={() => navigate(`/admin/projects/${project.uuid}`)}
                                    >
                                        <TableCell>
                                            <Stack direction="row" alignItems="center" gap={1}>
                                                <Folder color="primary" fontSize="small" />
                                                <Typography fontWeight={500}>
                                                    {project.name}
                                                </Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontFamily="monospace">
                                                {project.subdomain}
                                            </Typography>
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
                                        <TableCell>
                                            {formatInUserTimezone(
                                                project.created_at,
                                                currentUser?.timezone || 'America/Los_Angeles',
                                                'PP'
                                            )}
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/admin/projects/${project.uuid}/edit`);
                                                }}
                                            >
                                                <Edit />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* Edit Customer Dialog */}
            <Dialog open={editDialogOpen} onClose={() => !saving && setEditDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Customer</DialogTitle>
                <DialogContent>
                    {saveError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {saveError}
                        </Alert>
                    )}
                    <Stack spacing={3} sx={{ mt: 2 }}>
                        <TextField
                            label="Customer Name"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            fullWidth
                            required
                            disabled={saving}
                        />
                        <TextField
                            label="Contact Name"
                            value={editForm.contact_name}
                            onChange={(e) => setEditForm({ ...editForm, contact_name: e.target.value })}
                            fullWidth
                            disabled={saving}
                        />
                        <TextField
                            label="Contact Phone"
                            value={editForm.contact_phone}
                            onChange={(e) => setEditForm({ ...editForm, contact_phone: e.target.value })}
                            fullWidth
                            disabled={saving}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={editForm.is_active}
                                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                                    disabled={saving}
                                />
                            }
                            label="Active"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={async () => {
                            if (!editForm.name.trim()) {
                                setSaveError('Customer name is required');
                                return;
                            }

                            setSaving(true);
                            setSaveError(null);
                            try {
                                const response = await fetch(
                                    `${API_BASE}/api/admin/customers/${uuid}`,
                                    {
                                        method: 'PATCH',
                                        headers: {
                                            ...getAuthHeader(),
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                            name: editForm.name,
                                            contact_name: editForm.contact_name || null,
                                            contact_phone: editForm.contact_phone || null,
                                            is_active: editForm.is_active,
                                        }),
                                    }
                                );

                                if (!response.ok) {
                                    const errorData = await response.json();
                                    throw new Error(errorData.detail || 'Failed to update customer');
                                }

                                const updatedCustomer = await response.json();
                                setCustomer(updatedCustomer);
                                setEditDialogOpen(false);
                            } catch (err) {
                                setSaveError(err instanceof Error ? err.message : 'Failed to update customer');
                            } finally {
                                setSaving(false);
                            }
                        }}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container >
    );
}
