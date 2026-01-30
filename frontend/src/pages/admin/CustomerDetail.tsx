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

interface Customer {
    id: number;
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
    name: string;
    subdomain: string;
    is_active: boolean;
    created_at: string;
    documents_count: number;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

export default function CustomerDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch customer details
                const customerResponse = await fetch(
                    `${API_BASE}/api/admin/customers/${id}`,
                    { headers: getAuthHeader() }
                );

                if (!customerResponse.ok) {
                    throw new Error('Failed to fetch customer');
                }

                const customerData = await customerResponse.json();
                setCustomer(customerData);

                // Fetch customer's projects
                const projectsResponse = await fetch(
                    `${API_BASE}/api/admin/projects?customer_id=${id}`,
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

        if (id) {
            fetchData();
        }
    }, [id]);

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
                            // TODO: Open edit dialog
                            alert('Edit functionality coming soon!');
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
                                    {new Date(customer.created_at).toLocaleDateString()}
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
                                        onClick={() => navigate(`/admin/projects/${project.id}`)}
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
                                            {new Date(project.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/admin/projects/${project.id}`);
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
        </Container>
    );
}
