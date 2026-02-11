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
    TableSortLabel,
    Chip,
    TextField,
    Stack,
    Button,
    CircularProgress,
    Alert,
    IconButton,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Card,
    CardContent,
    useTheme,
} from '@mui/material';
import { Add, Edit, Delete, Folder, RecordVoiceOver } from '@mui/icons-material';
import { ReadinessBadge } from '../../components/admin/ReadinessBadge';
import { useNavigate } from 'react-router-dom';
import { getAuthHeader } from '../../utils/authUtils';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';
import { useAuth } from '../../context/AuthProvider';
import { formatInUserTimezone } from '../../utils/timezoneUtils';
import usePageTitle from '../../hooks/usePageTitle';
import ConfirmDialog from '../../components/ConfirmDialog';
import { API_BASE } from '@/config/api';

interface Project {
    id: number;
    uuid: string;
    customer_id: number;
    name: string;
    slug: string;
    description: string | null;
    logo: string | null;

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
    is_demo: boolean;
    is_enabled: boolean;
    is_ready: boolean;
    created_at: string;
    updated_at: string;
    documents_count: number;
    customer_name: string | null;
    customer_uuid: string | null;
}

interface Customer {
    id: number;
    name: string;
}

export default function Projects() {
    const { user: currentUser } = useAuth();
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
    // Dialog state removed in favor of /admin/projects/new page
    const [orderBy, setOrderBy] = useState<keyof Project>('name');
    const [order, setOrder] = useState<'asc' | 'desc'>('asc');

    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<number | null>(null);

    const fetchCustomers = useCallback(async () => {
        try {
            const response = await fetch(
                `${API_BASE}/api/v1/admin/customers?per_page=1000`,
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
                `${API_BASE}/api/v1/admin/projects?${params}`,
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

    usePageTitle('Chatbot Projects');

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

    const handleDeleteClick = (id: number) => {
        setProjectToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!projectToDelete) return;

        try {
            const response = await fetch(`${API_BASE}/api/v1/admin/projects/${projectToDelete}`, {
                method: 'DELETE',
                headers: getAuthHeader(),
            });

            if (!response.ok) throw new Error('Failed to delete project');

            fetchProjects();
            setDeleteDialogOpen(false);
            setProjectToDelete(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete project');
            setDeleteDialogOpen(false); // Close dialog even on error, or keep it open? Usually close.
        }
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
                <AdminBreadcrumbs items={[{ label: 'Chatbot Projects' }]} />

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
                        Chatbot Projects
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => navigate('/admin/projects/new')}
                    >
                        Add Chatbot Project
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
                    <StatCard title="Total Chatbot Projects" value={total} icon={<RecordVoiceOver sx={{ fontSize: 40 }} />} />
                    <StatCard
                        title="Active Chatbot Projects"
                        value={projects.filter(p => p.is_active).length}
                        icon={<RecordVoiceOver sx={{ fontSize: 40 }} />}
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
                            label="Search chatbot projects"
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
                                            <TableCell>
                                                <TableSortLabel
                                                    active={orderBy === 'name'}
                                                    direction={orderBy === 'name' ? order : 'asc'}
                                                    onClick={() => {
                                                        const isAsc = orderBy === 'name' && order === 'asc';
                                                        setOrder(isAsc ? 'desc' : 'asc');
                                                        setOrderBy('name');
                                                    }}
                                                >
                                                    Name
                                                </TableSortLabel>
                                            </TableCell>
                                            <TableCell>Customer</TableCell>

                                            <TableCell>
                                                <TableSortLabel
                                                    active={orderBy === 'documents_count'}
                                                    direction={orderBy === 'documents_count' ? order : 'asc'}
                                                    onClick={() => {
                                                        const isAsc = orderBy === 'documents_count' && order === 'asc';
                                                        setOrder(isAsc ? 'desc' : 'asc');
                                                        setOrderBy('documents_count');
                                                    }}
                                                >
                                                    Documents
                                                </TableSortLabel>
                                            </TableCell>
                                            <TableCell>
                                                <TableSortLabel
                                                    active={orderBy === 'created_at'}
                                                    direction={orderBy === 'created_at' ? order : 'asc'}
                                                    onClick={() => {
                                                        const isAsc = orderBy === 'created_at' && order === 'asc';
                                                        setOrder(isAsc ? 'desc' : 'asc');
                                                        setOrderBy('created_at');
                                                    }}
                                                >
                                                    Created at
                                                </TableSortLabel>
                                            </TableCell>
                                            <TableCell>Updated at</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell align="right">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {projects.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} align="center">
                                                    <Typography color="textSecondary" py={4}>
                                                        No projects found
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            [...projects]
                                                .sort((a, b) => {
                                                    const aVal = a[orderBy];
                                                    const bVal = b[orderBy];
                                                    if (aVal === null || aVal === undefined) return 1;
                                                    if (bVal === null || bVal === undefined) return -1;
                                                    if (typeof aVal === 'string' && typeof bVal === 'string') {
                                                        return order === 'asc'
                                                            ? aVal.localeCompare(bVal)
                                                            : bVal.localeCompare(aVal);
                                                    }
                                                    if (aVal < bVal) return order === 'asc' ? -1 : 1;
                                                    if (aVal > bVal) return order === 'asc' ? 1 : -1;
                                                    return 0;
                                                })
                                                .map((project) => (
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
                                                            {project.customer_uuid && project.customer_name ? (
                                                                <Typography
                                                                    component="span"
                                                                    sx={{
                                                                        cursor: 'pointer',
                                                                        color: 'primary.main',
                                                                        '&:hover': { textDecoration: 'underline' },
                                                                    }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        navigate(`/admin/customers/${project.customer_uuid}`);
                                                                    }}
                                                                >
                                                                    {project.customer_name}
                                                                </Typography>
                                                            ) : (
                                                                project.customer_name || '—'
                                                            )}
                                                        </TableCell>

                                                        <TableCell>
                                                            <Typography variant="body2">
                                                                {project.documents_count}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2">
                                                                {formatInUserTimezone(
                                                                    project.created_at,
                                                                    currentUser?.timezone || 'America/Los_Angeles',
                                                                    'PP'
                                                                )}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2">
                                                                {formatInUserTimezone(
                                                                    project.updated_at,
                                                                    currentUser?.timezone || 'America/Los_Angeles',
                                                                    'PP'
                                                                )}
                                                            </Typography>
                                                        </TableCell>

                                                        <TableCell>
                                                            <Stack direction="row" spacing={1}>
                                                                <ReadinessBadge isReady={project.is_ready} />
                                                                <Chip
                                                                    label={project.is_enabled ? 'Active' : 'Disabled'}
                                                                    size="small"
                                                                    sx={{
                                                                        backgroundColor: project.is_enabled ? '#4caf50' : '#f44336',
                                                                        color: 'white',
                                                                        fontWeight: 600
                                                                    }}
                                                                />
                                                                {project.is_demo && (
                                                                    <Chip
                                                                        label="Demo"
                                                                        size="small"
                                                                        sx={{
                                                                            backgroundColor: '#1976d2',
                                                                            color: 'white',
                                                                            fontWeight: 600
                                                                        }}
                                                                    />
                                                                )}
                                                            </Stack>
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
                                                                    handleDeleteClick(project.id);
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

                <ConfirmDialog
                    open={deleteDialogOpen}
                    title="Delete Project"
                    content="Are you sure you want to delete this project? This action cannot be undone and will delete all associated documents."
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setDeleteDialogOpen(false)}
                    confirmText="Delete"
                    confirmColor="error"
                />

            </Container >
        </Box >
    );
}
