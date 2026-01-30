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
    ArrowBack,
    Edit,
    Delete,
    CheckCircle,
    Cancel,
} from '@mui/icons-material';
import { getAuthHeader } from '../../utils/authUtils';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';
import { useAuth } from '../../context/AuthContext';
import { formatInUserTimezone } from '../../utils/timezoneUtils';

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
    created_at: string;
    updated_at: string;
    last_login_at: string | null;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

export default function UserDetail() {
    const { user: currentUser } = useAuth();
    const { uuid } = useParams<{ uuid: string }>();
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
                const response = await fetch(`${API_BASE}/api/admin/users/${uuid}`, {
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
            const response = await fetch(`${API_BASE}/api/admin/users/${user.uuid}`, {
                method: 'DELETE',
                headers: getAuthHeader(),
            });

            if (!response.ok) {
                throw new Error('Failed to delete user');
            }

            navigate('/admin/users');
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
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/admin/users')}
                    sx={{ mt: 2 }}
                >
                    Back to Users
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth={false} sx={{ mt: 4, mb: 8, px: 3 }}>
            <AdminBreadcrumbs
                items={[
                    { label: 'Users', path: '/admin/users' },
                    { label: user.email },
                ]}
            />

            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
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
                <Stack direction="row" spacing={2}>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        onClick={() => navigate(-1)}
                    >
                        Back
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Edit />}
                        onClick={() => navigate(`/admin/users/${user.uuid}/edit`)}
                    >
                        Edit User
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
                                    <Typography variant="body1">—</Typography>
                                )}
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Status
                                </Typography>
                                <Box mt={0.5}>
                                    <Stack direction="row" spacing={1}>
                                        <Chip
                                            icon={user.is_active ? <CheckCircle /> : <Cancel />}
                                            label={user.is_active ? 'Active' : 'Inactive'}
                                            color={user.is_active ? 'success' : 'default'}
                                            size="small"
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
                        </Stack>
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
