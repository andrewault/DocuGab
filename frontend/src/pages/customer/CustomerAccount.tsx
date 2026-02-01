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
    Chip,
    CircularProgress,
    Alert,
    useTheme,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    TableSortLabel,
} from '@mui/material';
import {
    AccountCircle,
    Business,
    PersonAdd,
    Block,
    CheckCircle,
    VerifiedUser,
    Edit,
    EditOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAuthHeader } from '../../utils/authUtils';
import { formatInUserTimezone } from '../../utils/timezoneUtils';
import CustomerBreadcrumbs from '../../components/CustomerBreadcrumbs';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

interface CustomerInfo {
    id: number;
    uuid: string;
    name: string;
    email: string | null;
    contact_name: string | null;
    contact_phone: string | null;
    is_active: boolean;
    is_docutok_customer: boolean;
    created_at: string;
    updated_at: string;
}

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

interface AccountData {
    customer: CustomerInfo;
    users: AccountUser[];
    current_user_role: string;
}

type SortField = 'full_name' | 'email' | 'created_at' | 'customer_role';

export default function CustomerAccount() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [accountData, setAccountData] = useState<AccountData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [inviteRole, setInviteRole] = useState('member');
    const [inviting, setInviting] = useState(false);
    const [orderBy, setOrderBy] = useState<SortField>('full_name');
    const [order, setOrder] = useState<'asc' | 'desc'>('asc');

    const fetchAccountData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `${API_BASE}/api/customer/account`,
                { headers: getAuthHeader() }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch account data');
            }

            const data = await response.json();
            setAccountData(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load account data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAccountData();
    }, [fetchAccountData]);

    const handleInviteUser = async () => {
        if (!inviteEmail || !inviteName) {
            return;
        }

        try {
            setInviting(true);
            const response = await fetch(
                `${API_BASE}/api/customer/account/invite`,
                {
                    method: 'POST',
                    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: inviteEmail,
                        full_name: inviteName,
                        customer_role: inviteRole,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to invite user');
            }

            // Refresh account data
            await fetchAccountData();

            // Close dialog and reset form
            setInviteDialogOpen(false);
            setInviteEmail('');
            setInviteName('');
            setInviteRole('member');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to invite user');
        } finally {
            setInviting(false);
        }
    };

    const handleDeactivateUser = async (userUuid: string) => {
        if (!confirm('Are you sure you want to deactivate this user? They will no longer be able to access this account.')) {
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE}/api/customer/account/users/${userUuid}/deactivate`,
                {
                    method: 'PATCH',
                    headers: getAuthHeader(),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to deactivate user');
            }

            // Refresh account data
            await fetchAccountData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to deactivate user');
        }
    };

    const handleReactivateUser = async (userUuid: string) => {
        try {
            const response = await fetch(
                `${API_BASE}/api/customer/account/users/${userUuid}/reactivate`,
                {
                    method: 'PATCH',
                    headers: getAuthHeader(),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to reactivate user');
            }

            // Refresh account data
            await fetchAccountData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reactivate user');
        }
    };

    const handleSort = (field: SortField) => {
        const isAsc = orderBy === field && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(field);
    };

    const sortedUsers = accountData?.users ? [...accountData.users].sort((a, b) => {
        let aValue: string | null = null;
        let bValue: string | null = null;

        if (orderBy === 'full_name') {
            aValue = a.full_name || a.email;
            bValue = b.full_name || b.email;
        } else if (orderBy === 'email') {
            aValue = a.email;
            bValue = b.email;
        } else if (orderBy === 'created_at') {
            return order === 'asc'
                ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        } else if (orderBy === 'customer_role') {
            aValue = a.customer_role || '';
            bValue = b.customer_role || '';
        }

        if (aValue && bValue) {
            return order === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        }
        return 0;
    }) : [];

    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    const canInviteUsers = accountData?.current_user_role === 'owner' || accountData?.current_user_role === 'admin';
    const canManageUsers = canInviteUsers;

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
                {/* Breadcrumbs */}
                <CustomerBreadcrumbs items={[{ label: 'Account' }]} />

                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <AccountCircle sx={{ fontSize: 32, color: '#6366f1' }} />
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
                            Account
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {accountData?.current_user_role === 'owner' && (
                            <Button
                                variant="outlined"
                                startIcon={<EditOutlined />}
                                onClick={() => navigate('/customer/account/edit')}
                                sx={{ textTransform: 'none' }}
                            >
                                Edit Account
                            </Button>
                        )}
                        {canInviteUsers && (
                            <Button
                                variant="contained"
                                startIcon={<PersonAdd />}
                                onClick={() => setInviteDialogOpen(true)}
                                sx={{ textTransform: 'none' }}
                            >
                                Invite User
                            </Button>
                        )}
                    </Box>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {/* Account Information */}
                {accountData && (
                    <>
                        <Paper
                            elevation={3}
                            sx={{
                                p: 3,
                                mb: 3,
                                borderRadius: 2,
                                bgcolor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'background.paper',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                <Business sx={{ fontSize: 28, color: '#6366f1' }} />
                                <Typography variant="h5" fontWeight={700}>
                                    {accountData.customer.name}
                                </Typography>
                                {accountData.customer.is_docutok_customer && (
                                    <Chip label="Internal" size="small" color="secondary" />
                                )}
                                <Chip
                                    label={accountData.customer.is_active ? 'Active' : 'Inactive'}
                                    color={accountData.customer.is_active ? 'success' : 'default'}
                                    size="small"
                                />
                            </Box>

                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
                                {accountData.customer.email && (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Email
                                        </Typography>
                                        <Typography variant="body1">{accountData.customer.email}</Typography>
                                    </Box>
                                )}
                                {accountData.customer.contact_name && (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Contact Name
                                        </Typography>
                                        <Typography variant="body1">{accountData.customer.contact_name}</Typography>
                                    </Box>
                                )}
                                {accountData.customer.contact_phone && (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Contact Phone
                                        </Typography>
                                        <Typography variant="body1">{accountData.customer.contact_phone}</Typography>
                                    </Box>
                                )}
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Created
                                    </Typography>
                                    <Typography variant="body1">
                                        {formatInUserTimezone(accountData.customer.created_at, user?.timezone || 'UTC')}
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>

                        {/* Users Table */}
                        <Paper
                            elevation={3}
                            sx={{
                                p: 3,
                                borderRadius: 2,
                                bgcolor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'background.paper',
                            }}
                        >
                            <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
                                Users ({accountData.users.length})
                            </Typography>

                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>
                                                <TableSortLabel
                                                    active={orderBy === 'full_name'}
                                                    direction={orderBy === 'full_name' ? order : 'asc'}
                                                    onClick={() => handleSort('full_name')}
                                                >
                                                    Name
                                                </TableSortLabel>
                                            </TableCell>
                                            <TableCell>
                                                <TableSortLabel
                                                    active={orderBy === 'email'}
                                                    direction={orderBy === 'email' ? order : 'asc'}
                                                    onClick={() => handleSort('email')}
                                                >
                                                    Email
                                                </TableSortLabel>
                                            </TableCell>
                                            <TableCell>
                                                <TableSortLabel
                                                    active={orderBy === 'customer_role'}
                                                    direction={orderBy === 'customer_role' ? order : 'asc'}
                                                    onClick={() => handleSort('customer_role')}
                                                >
                                                    Role
                                                </TableSortLabel>
                                            </TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>
                                                <TableSortLabel
                                                    active={orderBy === 'created_at'}
                                                    direction={orderBy === 'created_at' ? order : 'asc'}
                                                    onClick={() => handleSort('created_at')}
                                                >
                                                    Created
                                                </TableSortLabel>
                                            </TableCell>
                                            <TableCell>Last Login</TableCell>
                                            {canManageUsers && <TableCell align="right">Actions</TableCell>}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {sortedUsers.map((accountUser) => (
                                            <TableRow
                                                key={accountUser.uuid}
                                                hover
                                                sx={{
                                                    cursor: 'pointer',
                                                    '&:hover': {
                                                        bgcolor: isDark
                                                            ? 'rgba(99, 102, 241, 0.1)'
                                                            : 'rgba(99, 102, 241, 0.05)',
                                                    },
                                                }}
                                                onClick={() => navigate(`/customer/account/users/${accountUser.uuid}`)}
                                            >
                                                <TableCell>
                                                    <Typography variant="body1" fontWeight={600}>
                                                        {accountUser.full_name || 'N/A'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{accountUser.email}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={accountUser.customer_role || 'member'}
                                                        size="small"
                                                        variant="outlined"
                                                        color={accountUser.customer_role === 'owner' ? 'primary' : 'default'}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                                        <Chip
                                                            label={accountUser.is_active ? 'Active' : 'Inactive'}
                                                            color={accountUser.is_active ? 'success' : 'default'}
                                                            size="small"
                                                        />
                                                        {accountUser.is_verified && (
                                                            <VerifiedUser fontSize="small" color="primary" titleAccess="Verified" />
                                                        )}
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {formatInUserTimezone(accountUser.created_at, user?.timezone || 'UTC')}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {accountUser.last_login_at
                                                            ? formatInUserTimezone(accountUser.last_login_at, user?.timezone || 'UTC')
                                                            : 'Never'}
                                                    </Typography>
                                                </TableCell>
                                                {canManageUsers && (
                                                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                                                        {accountUser.id !== user?.id && (
                                                            <>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => navigate(`/customer/account/users/${accountUser.uuid}/edit`)}
                                                                    title="Edit user"
                                                                >
                                                                    <Edit fontSize="small" />
                                                                </IconButton>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() =>
                                                                        accountUser.is_active
                                                                            ? handleDeactivateUser(accountUser.uuid)
                                                                            : handleReactivateUser(accountUser.uuid)
                                                                    }
                                                                    title={accountUser.is_active ? 'Deactivate' : 'Reactivate'}
                                                                >
                                                                    {accountUser.is_active ? (
                                                                        <Block fontSize="small" color="error" />
                                                                    ) : (
                                                                        <CheckCircle fontSize="small" color="success" />
                                                                    )}
                                                                </IconButton>
                                                            </>
                                                        )}
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </>
                )}
            </Container>

            {/* Invite User Dialog */}
            <Dialog open={inviteDialogOpen} onClose={() => !inviting && setInviteDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Invite New User</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label="Email"
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Full Name"
                            value={inviteName}
                            onChange={(e) => setInviteName(e.target.value)}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Role"
                            select
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value)}
                            fullWidth
                        >
                            <MenuItem value="member">Member</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                            {accountData?.current_user_role === 'owner' && (
                                <MenuItem value="owner">Owner</MenuItem>
                            )}
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setInviteDialogOpen(false)} disabled={inviting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleInviteUser}
                        variant="contained"
                        disabled={inviting || !inviteEmail || !inviteName}
                    >
                        {inviting ? 'Inviting...' : 'Send Invitation'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
