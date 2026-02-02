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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Card,
    CardContent,
    useTheme,
} from '@mui/material';
import { Add, Edit, Delete, Business } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getAuthHeader } from '../../utils/authUtils';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';
import { useAuth } from '../../context/AuthProvider';
import { formatInUserTimezone } from '../../utils/timezoneUtils';

interface Customer {
    id: number;
    uuid: string;
    name: string;
    contact_name: string | null;
    contact_phone: string | null;
    email: string | null;
    is_active: boolean;
    is_docutok_customer: boolean;
    created_at: string;
    updated_at: string;
    projects_count: number;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

export default function Customers() {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [orderBy, setOrderBy] = useState<keyof Customer>('name');
    const [order, setOrder] = useState<'asc' | 'desc'>('asc');

    const fetchCustomers = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: String(page + 1),
                per_page: String(rowsPerPage),
                ...(search && { search }),
            });

            const response = await fetch(
                `${API_BASE}/api/v1/admin/customers?${params}`,
                { headers: getAuthHeader() }
            );

            if (!response.ok) throw new Error('Failed to fetch customers');

            const data = await response.json();
            setCustomers(data.customers);
            setTotal(data.total);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load customers');
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, search]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const handlePageChange = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleDeleteClick = (customer: Customer) => {
        setCustomerToDelete(customer);
        setDeleteConfirmText('');
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!customerToDelete) return;

        try {
            const response = await fetch(`${API_BASE}/api/v1/admin/customers/${customerToDelete.id}`, {
                method: 'DELETE',
                headers: getAuthHeader(),
            });

            if (!response.ok) throw new Error('Failed to delete customer');

            setDeleteDialogOpen(false);
            setCustomerToDelete(null);
            fetchCustomers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete customer');
            setDeleteDialogOpen(false);
            setCustomerToDelete(null);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setCustomerToDelete(null);
        setDeleteConfirmText('');
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
                <AdminBreadcrumbs items={[{ label: 'Customers' }]} />

                {/* Header with Title and Add Button */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Business sx={{ fontSize: 32, color: '#6366f1' }} />
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
                            Customers
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => navigate('/admin/customers/new')}
                    >
                        Add Customer
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
                    <StatCard title="Total Customers" value={total} icon={<Business sx={{ fontSize: 40 }} />} />
                    <StatCard
                        title="Active Customers"
                        value={customers.filter(c => c.is_active).length}
                        icon={<Business sx={{ fontSize: 40 }} />}
                    />
                    <StatCard
                        title="Projects"
                        value={customers.reduce((sum, c) => sum + c.projects_count, 0)}
                        icon={<Business sx={{ fontSize: 40 }} />}
                    />
                </Box>

                <TextField
                    fullWidth
                    label="Search customers"
                    variant="outlined"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(0);
                    }}
                    sx={{ mb: 3 }}
                />

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
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
                                        <TableCell>Contact Name</TableCell>
                                        <TableCell>Email</TableCell>
                                        <TableCell>Contact Phone</TableCell>
                                        <TableCell>
                                            <TableSortLabel
                                                active={orderBy === 'projects_count'}
                                                direction={orderBy === 'projects_count' ? order : 'asc'}
                                                onClick={() => {
                                                    const isAsc = orderBy === 'projects_count' && order === 'asc';
                                                    setOrder(isAsc ? 'desc' : 'asc');
                                                    setOrderBy('projects_count');
                                                }}
                                            >
                                                Projects
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
                                    {customers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} align="center">
                                                <Typography color="textSecondary" py={4}>
                                                    No customers found
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        [...customers]
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
                                            .map((customer) => (
                                                <TableRow
                                                    key={customer.id}
                                                    hover
                                                    sx={{ cursor: 'pointer' }}
                                                    onClick={() => navigate(`/admin/customers/${customer.uuid}`)}
                                                >
                                                    <TableCell>
                                                        <Typography fontWeight={500}>
                                                            {customer.name}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        {customer.contact_name || '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {customer.email || '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {customer.contact_phone || '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={customer.projects_count}
                                                            size="small"
                                                            color="primary"
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {formatInUserTimezone(
                                                                customer.created_at,
                                                                currentUser?.timezone || 'America/Los_Angeles',
                                                                'PP'
                                                            )}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {formatInUserTimezone(
                                                                customer.updated_at,
                                                                currentUser?.timezone || 'America/Los_Angeles',
                                                                'PP'
                                                            )}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Stack direction="row" spacing={1}>
                                                            <Chip
                                                                label={customer.is_active ? 'Active' : 'Inactive'}
                                                                color={customer.is_active ? 'success' : 'default'}
                                                                size="small"
                                                            />
                                                            {customer.is_docutok_customer && (
                                                                <Chip
                                                                    label="Internal"
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
                                                                navigate(`/admin/customers/${customer.uuid}/edit`);
                                                            }}
                                                            color="primary"
                                                        >
                                                            <Edit />
                                                        </IconButton>
                                                        {currentUser?.role === 'superadmin' && (
                                                            <IconButton
                                                                size="small"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteClick(customer);
                                                                }}
                                                                color="error"
                                                            >
                                                                <Delete />
                                                            </IconButton>
                                                        )}
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

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={deleteDialogOpen}
                    onClose={handleDeleteCancel}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle sx={{ color: 'error.main' }}>Delete Customer</DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to delete <strong>{customerToDelete?.name}</strong>?
                        </Typography>
                        <Typography color="error" sx={{ mt: 2, fontWeight: 500 }}>
                            ⚠️ This will also delete all associated projects and documents.
                        </Typography>
                        <Typography color="text.secondary" sx={{ mt: 1, fontSize: '0.875rem' }}>
                            This action cannot be undone.
                        </Typography>
                        <TextField
                            fullWidth
                            label='Type "DELETE" to confirm'
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            sx={{ mt: 3 }}
                            autoFocus
                            placeholder="DELETE"
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleDeleteCancel}>Cancel</Button>
                        <Button
                            onClick={handleDeleteConfirm}
                            variant="contained"
                            color="error"
                            disabled={deleteConfirmText !== 'DELETE'}
                        >
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
}
