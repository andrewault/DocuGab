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
    Card,
    CardContent,
    useTheme,
} from '@mui/material';
import { Add, Edit, Delete, Business } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getAuthHeader } from '../../utils/authUtils';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';

interface Customer {
    id: number;
    name: string;
    contact_name: string | null;
    contact_phone: string | null;
    is_active: boolean;
    created_at: string;
    projects_count: number;
}

interface CustomerFormData {
    name: string;
    contact_name: string;
    contact_phone: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

export default function Customers() {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [formData, setFormData] = useState<CustomerFormData>({
        name: '',
        contact_name: '',
        contact_phone: '',
    });

    const fetchCustomers = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: String(page + 1),
                per_page: String(rowsPerPage),
                ...(search && { search }),
            });

            const response = await fetch(
                `${API_BASE}/api/admin/customers?${params}`,
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

    const handleOpenDialog = (customer?: Customer) => {
        if (customer) {
            setEditingCustomer(customer);
            setFormData({
                name: customer.name,
                contact_name: customer.contact_name || '',
                contact_phone: customer.contact_phone || '',
            });
        } else {
            setEditingCustomer(null);
            setFormData({
                name: '',
                contact_name: '',
                contact_phone: '',
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingCustomer(null);
    };

    const handleSubmit = async () => {
        try {
            const url = editingCustomer
                ? `${API_BASE}/api/admin/customers/${editingCustomer.id}`
                : `${API_BASE}/api/admin/customers`;

            const method = editingCustomer ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    ...getAuthHeader(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error('Failed to save customer');

            handleCloseDialog();
            fetchCustomers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save customer');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this customer? This will also delete all associated projects and documents.')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/api/admin/customers/${id}`, {
                method: 'DELETE',
                headers: getAuthHeader(),
            });

            if (!response.ok) throw new Error('Failed to delete customer');

            fetchCustomers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete customer');
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
                <AdminBreadcrumbs items={[{ label: 'Customers' }]} />

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
                        Customers
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
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
                                        <TableCell>Name</TableCell>
                                        <TableCell>Contact Name</TableCell>
                                        <TableCell>Contact Phone</TableCell>
                                        <TableCell>Projects</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {customers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">
                                                <Typography color="textSecondary" py={4}>
                                                    No customers found
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        customers.map((customer) => (
                                            <TableRow
                                                key={customer.id}
                                                hover
                                                sx={{ cursor: 'pointer' }}
                                                onClick={() => navigate(`/admin/customers/${customer.id}`)}
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
                                                    <Chip
                                                        label={customer.is_active ? 'Active' : 'Inactive'}
                                                        color={customer.is_active ? 'success' : 'default'}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenDialog(customer);
                                                        }}
                                                        color="primary"
                                                    >
                                                        <Edit />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(customer.id);
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

                {/* Create/Edit Dialog */}
                <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                    <DialogTitle>
                        {editingCustomer ? 'Edit Customer' : 'Add Customer'}
                    </DialogTitle>
                    <DialogContent>
                        <Stack spacing={3} sx={{ mt: 2 }}>
                            <TextField
                                fullWidth
                                label="Customer Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <TextField
                                fullWidth
                                label="Contact Name"
                                value={formData.contact_name}
                                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                            />
                            <TextField
                                fullWidth
                                label="Contact Phone"
                                value={formData.contact_phone}
                                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button
                            onClick={handleSubmit}
                            variant="contained"
                            disabled={!formData.name}
                        >
                            {editingCustomer ? 'Update' : 'Create'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
}
