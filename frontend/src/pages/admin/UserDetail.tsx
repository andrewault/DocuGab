import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from '@mui/material';
import {
    Person,
    Email,
    Business,
    CalendarToday,
    Edit,
    Delete,
    CheckCircle,
    Cancel,
    Group,
} from '@mui/icons-material';
import { getAuthHeader } from '../../utils/authUtils';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';
import { useAuth } from '../../context/AuthProvider';
import { formatInUserTimezone } from '../../utils/timezoneUtils';
import { API_BASE } from '@/config/api';

interface User {
    id: number;
    uuid: string;
    email: string;
    full_name: string | null;
    role: string;
    is_active: boolean;
    is_verified: boolean;
    customer_id: number | null;
    customer_uuid: string | null;
    customer_name: string | null;
    phone_number: string | null;
    company: string | null;
    job_title: string | null;
    timezone: string;
    last_ip_address: string | null;
    created_at: string;
    updated_at: string;
    last_login_at: string | null;
}

export default function UserDetail() {
    const { user: currentUser } = useAuth();
    const { uuid, customerUuid } = useParams<{ uuid: string, customerUuid?: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_BASE}/api/v1/admin/users/${uuid}`, {
                    headers: getAuthHeader(),
                });
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('User not found');
                    }
                    throw new Error('Failed to fetch user');
                }
                const data = await response.json();
                setUser(data);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load user');
            } finally {
                setLoading(false);
            }
        };

        if (uuid && currentUser) {
            fetchUser();
        }
    }, [uuid, currentUser, location.key]);

    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!user) return;

        try {
            setDeleting(true);
            const response = await fetch(`${API_BASE}/api/v1/admin/users/${user.uuid}`, {
                method: 'DELETE',
                headers: getAuthHeader(),
            });

            if (!response.ok) {
                throw new Error('Failed to delete user');
            }

            if (customerUuid) {
                navigate(`/admin/customers/${customerUuid}`);
            } else {
                navigate('/admin/admin-users');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete user');
            setDeleteDialogOpen(false);
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
    };

    if (loading) {
        return (
            <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: 3 }}>
                <Box display="flex" justifyContent="center" py={8}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error || !user) {
        return (
            <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: 3 }}>
                <Alert severity="error">{error || 'User not found'}</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth={false} sx={{ mt: 4, mb: 8, px: 3 }}>
            <AdminBreadcrumbs
                items={[
                    ...(user.customer_uuid && user.customer_name
                        ? [
                            { label: 'Customers', path: '/admin/customers' },
                            { label: user.customer_name, path: `/admin/customers/${user.customer_uuid}` },
                        ]
                        : [{ label: 'Admin Users', path: '/admin/admin-users' }]),
                    { label: user.email },
                ]}
            />

            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Group sx={{ fontSize: 32, color: '#6366f1' }} />
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
                        {user.full_name || user.email}
                    </Typography>
                </Box>
                <Stack direction="row" spacing={2}>
                    <Button
                        variant="contained"
                        startIcon={<Edit />}
                        onClick={() => navigate(customerUuid
                            ? `/admin/customers/${customerUuid}/users/${user.uuid}/edit`
                            : `/admin/admin-users/${user.uuid}/edit`)}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<Delete />}
                        onClick={handleDeleteClick}
                    >
                        Delete
                    </Button>
                </Stack>
            </Stack>

            {/* User Details */}
            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    User Details
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
                    <Box sx={{ flex: 1 }}>
                        <Stack spacing={2}>
                            <Box>
                                <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                                    <Email fontSize="small" />
                                    Email
                                </Typography>
                                <Typography variant="body1" fontWeight={500}>
                                    {user.email}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                                    <Person fontSize="small" />
                                    Full Name
                                </Typography>
                                <Typography variant="body1">
                                    {user.full_name || '—'}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Role
                                </Typography>
                                <Box mt={0.5}>
                                    <Chip
                                        label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                        color={user.role === 'superadmin' ? 'error' : user.role === 'admin' ? 'warning' : 'default'}
                                        size="small"
                                        sx={
                                            user.role === 'customer'
                                                ? { bgcolor: '#1976d2', color: 'white', fontWeight: 600 }
                                                : {}
                                        }
                                    />
                                </Box>
                            </Box>
                        </Stack>
                    </Box>

                    <Box sx={{ flex: 1 }}>
                        <Stack spacing={2}>
                            <Box>
                                <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                                    <Business fontSize="small" />
                                    Customer
                                </Typography>
                                {user.customer_uuid ? (
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            color: 'primary.main',
                                            cursor: 'pointer',
                                            '&:hover': { textDecoration: 'underline' },
                                        }}
                                        onClick={() => navigate(`/admin/customers/${user.customer_uuid}`)}
                                    >
                                        {user.customer_name}
                                    </Typography>
                                ) : (
                                    <Typography variant="body1">None (admin)</Typography>
                                )}
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Status
                                </Typography>
                                <Box mt={0.5}>
                                    <Stack direction="row" spacing={1}>
                                        <Chip
                                            icon={user.is_active ? <CheckCircle style={{ color: 'white' }} /> : <Cancel />}
                                            label={user.is_active ? 'Active' : 'Inactive'}
                                            size="small"
                                            sx={{
                                                backgroundColor: user.is_active ? '#4caf50' : '#e0e0e0',
                                                color: user.is_active ? 'white' : 'text.primary',
                                                fontWeight: 600,
                                                '& .MuiChip-icon': { color: user.is_active ? 'white' : 'inherit' }
                                            }}
                                        />
                                        <Chip
                                            icon={user.is_verified ? <CheckCircle /> : <Cancel />}
                                            label={user.is_verified ? 'Verified' : 'Unverified'}
                                            color={user.is_verified ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </Stack>
                                </Box>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                                    <CalendarToday fontSize="small" />
                                    Last Login
                                </Typography>
                                <Typography variant="body1">
                                    {user.last_login_at
                                        ? formatInUserTimezone(user.last_login_at, currentUser?.timezone || 'UTC')
                                        : 'Never'}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Last IP Address
                                </Typography>
                                <Typography variant="body1">
                                    {user.last_ip_address || '—'}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Timezone
                                </Typography>
                                <Typography variant="body1">
                                    {user.timezone}
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>
                </Stack>

                <Divider sx={{ my: 3 }} />

                <Stack direction="row" spacing={4} flexWrap="wrap">
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Phone Number
                        </Typography>
                        <Typography variant="body2">
                            {user.phone_number || '—'}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Company
                        </Typography>
                        <Typography variant="body2">
                            {user.company || '—'}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Job Title
                        </Typography>
                        <Typography variant="body2">
                            {user.job_title || '—'}
                        </Typography>
                    </Box>
                </Stack>

                <Divider sx={{ my: 3 }} />

                <Stack direction="row" spacing={4}>
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Created
                        </Typography>
                        <Typography variant="body2">
                            {formatInUserTimezone(user.created_at, currentUser?.timezone || 'UTC')}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Updated
                        </Typography>
                        <Typography variant="body2">
                            {formatInUserTimezone(user.updated_at, currentUser?.timezone || 'UTC')}
                        </Typography>
                    </Box>
                </Stack>
            </Paper>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
                <DialogTitle>Delete User</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this user? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel} disabled={deleting}>
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteConfirm} color="error" disabled={deleting}>
                        {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
