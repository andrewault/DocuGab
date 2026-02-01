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
} from '@mui/material';
import {
    Person,
    Email,
    CalendarToday,
    ArrowBack,
    Edit,
    CheckCircle,
    Cancel,
    VerifiedUser,
} from '@mui/icons-material';
import { getAuthHeader } from '../../utils/authUtils';
import CustomerBreadcrumbs from '../../components/CustomerBreadcrumbs';
import InactiveCustomerBanner from '../../components/InactiveCustomerBanner';
import { useAuth } from '../../context/AuthContext';
import { formatInUserTimezone } from '../../utils/timezoneUtils';

interface AccountUser {
    id: number;
    uuid: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    role: string;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
    last_login_at: string | null;
    customer_role: string | null;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

export default function CustomerUserDetail() {
    const { user: currentUser } = useAuth();
    const { uuid } = useParams<{ uuid: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<AccountUser | null>(null);
    const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                setLoading(true);
                // Fetch from account endpoint to get all users
                const response = await fetch(`${API_BASE}/api/customer/account`, {
                    headers: getAuthHeader(),
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch account data');
                }
                const data = await response.json();

                // Find the specific user by UUID
                const targetUser = data.users.find((u: AccountUser) => u.uuid === uuid);
                if (!targetUser) {
                    throw new Error('User not found');
                }

                setUser(targetUser);
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
    }, [uuid, currentUser]);

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
                    onClick={() => navigate('/customer/account')}
                    sx={{ mt: 2 }}
                >
                    Back to Account
                </Button>
            </Container>
        );
    }

    // Determine if current user can edit this user
    // Owners can edit anyone, Members can only edit themselves
    const canEdit = currentUserRole === 'owner' || currentUser?.id === user.id;

    return (
        <Container maxWidth={false} sx={{ mt: 4, mb: 8, px: 3 }}>
            <InactiveCustomerBanner />
            <CustomerBreadcrumbs
                items={[
                    { label: 'Account', path: '/customer/account' },
                    { label: user.email },
                ]}
            />

            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Person sx={{ fontSize: 32, color: '#6366f1' }} />
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
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        onClick={() => navigate('/customer/account')}
                    >
                        Back
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Edit />}
                        onClick={() => navigate(`/customer/account/users/${user.uuid}/edit`)}
                    >
                        Edit User
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
                                        label={user.customer_role || 'member'}
                                        color={user.customer_role === 'owner' ? 'primary' : 'default'}
                                        size="small"
                                    />
                                </Box>
                            </Box>
                        </Stack>
                    </Box>

                    <Box sx={{ flex: 1 }}>
                        <Stack spacing={2}>
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
                                            icon={user.is_verified ? <VerifiedUser /> : <Cancel />}
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

                <Box>
                    <Typography variant="caption" color="text.secondary">
                        Created
                    </Typography>
                    <Typography variant="body2">
                        {formatInUserTimezone(user.created_at, currentUser?.timezone || 'UTC')}
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
}
