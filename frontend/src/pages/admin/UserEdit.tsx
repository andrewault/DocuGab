import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Paper,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormControlLabel,
    Alert,
    CircularProgress,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    useTheme,
} from '@mui/material';
import { Save, Delete, Person } from '@mui/icons-material';
import { getAuthHeader } from '../../utils/authUtils';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';
import { getAllTimezones, getTimezoneLabel } from '../../utils/timezoneUtils';
import { API_BASE } from '@/config/api';

interface User {
    id: number;
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
    created_at: string;
}

interface Customer {
    id: number;
    uuid: string;
    name: string;
}

export default function UserEdit() {
    const { uuid, customerUuid } = useParams<{ uuid: string, customerUuid?: string }>();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form state
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('user');
    const [isActive, setIsActive] = useState(true);
    const [isVerified, setIsVerified] = useState(false);
    const [customerId, setCustomerId] = useState<number | null>(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [company, setCompany] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [timezone, setTimezone] = useState('America/Los_Angeles');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Escape key to go back
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                navigate('/admin');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate]);

    const fetchUser = useCallback(async () => {
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
            setFullName(data.full_name || '');
            setRole(data.role);
            setIsActive(data.is_active);
            setIsVerified(data.is_verified);
            setCustomerId(data.customer_id || null);
            setPhoneNumber(data.phone_number || '');
            setCompany(data.company || '');
            setJobTitle(data.job_title || '');
            setTimezone(data.timezone || 'America/Los_Angeles');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load user');
        } finally {
            setLoading(false);
        }
    }, [uuid]);

    const fetchCustomers = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE}/api/v1/admin/customers?page=1&per_page=100`, {
                headers: getAuthHeader(),
            });
            if (!response.ok) throw new Error('Failed to fetch customers');
            const data = await response.json();
            setCustomers(data.customers || []);
        } catch (err) {
            console.error('Failed to load customers:', err);
        }
    }, []);

    // Validate UUID and redirect if invalid
    useEffect(() => {
        if (!uuid) {
            navigate('/admin/users');
            return;
        }
    }, [uuid, navigate]);

    useEffect(() => {
        if (uuid) {
            fetchUser();
            fetchCustomers();
        }
    }, [fetchUser, uuid, fetchCustomers]);

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            const response = await fetch(`${API_BASE}/api/v1/admin/users/${uuid}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader(),
                },
                body: JSON.stringify({
                    full_name: fullName || null,
                    role,
                    is_active: isActive,
                    is_verified: isVerified,
                    customer_id: customerId,
                    phone_number: phoneNumber || null,
                    company: company || null,
                    job_title: jobTitle || null,
                    timezone: timezone,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Failed to update user');
            }

            const updatedUser = await response.json();
            setUser(updatedUser);
            // Navigate to detail page after successful save
            if (customerUuid) {
                navigate(`/admin/customers/${customerUuid}/users/${uuid}`);
            } else {
                navigate(`/admin/admin-users/${uuid}`);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update user');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        setDeleteDialogOpen(false);

        try {
            setSaving(true);
            const response = await fetch(`${API_BASE}/api/v1/admin/users/${uuid}`, {
                method: 'DELETE',
                headers: getAuthHeader(),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Failed to delete user');
            }

            if (customerUuid) {
                navigate(`/admin/customers/${customerUuid}`);
            } else {
                navigate('/admin/admin-users');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete user');
            setSaving(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
    };

    if (loading) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: isDark
                        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
                        : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #f8fafc 100%)',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (!user) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: isDark
                        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
                        : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #f8fafc 100%)',
                }}
            >
                <Alert severity="error">{error || 'User not found'}</Alert>
            </Box>
        );
    }

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
                <AdminBreadcrumbs items={customerUuid ? [
                    { label: 'Customers', path: '/admin/customers' },
                    { label: user.customer_name || 'Customer', path: `/admin/customers/${customerUuid}` },
                    { label: user.email, path: `/admin/customers/${customerUuid}/users/${uuid}` },
                    { label: 'Edit' }
                ] : [
                    { label: 'Admin Users', path: '/admin/admin-users' },
                    { label: user.email, path: `/admin/admin-users/${uuid}` },
                    { label: 'Edit' }
                ]} />

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
                            Edit User
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="outlined"
                            onClick={() => navigate(customerUuid
                                ? `/admin/customers/${customerUuid}/users/${uuid}`
                                : `/admin/admin-users/${uuid}`)}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Save />}
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<Delete />}
                            onClick={handleDeleteClick}
                            disabled={saving}
                        >
                            Delete
                        </Button>
                    </Stack>
                </Stack>

                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        borderRadius: 2,
                        bgcolor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'background.paper',
                    }}
                >

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
                            {success}
                        </Alert>
                    )}

                    <Stack spacing={3}>
                        <TextField
                            label="Full Name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSave();
                                }
                            }}
                            fullWidth
                        />

                        <FormControl fullWidth>
                            <InputLabel>Role</InputLabel>
                            <Select
                                value={role}
                                label="Role"
                                onChange={(e) => setRole(e.target.value)}
                            >
                                <MenuItem value="user">User</MenuItem>
                                <MenuItem value="customer">Customer</MenuItem>
                                <MenuItem value="admin">Admin</MenuItem>
                                <MenuItem value="superadmin">Superadmin</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            label="Phone Number"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            fullWidth
                        />

                        <TextField
                            label="Company"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            fullWidth
                        />

                        <TextField
                            label="Job Title"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            fullWidth
                        />

                        <FormControl fullWidth>
                            <InputLabel>Timezone</InputLabel>
                            <Select
                                value={timezone}
                                label="Timezone"
                                onChange={(e) => setTimezone(e.target.value)}
                            >
                                {getAllTimezones().map((tz) => (
                                    <MenuItem key={tz} value={tz}>
                                        {getTimezoneLabel(tz)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Customer</InputLabel>
                            <Select
                                value={customerId || ''}
                                label="Customer"
                                onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : null)}
                            >
                                <MenuItem value="">None (admin)</MenuItem>
                                {customers.map((customer) => (
                                    <MenuItem key={customer.id} value={customer.id}>
                                        {customer.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                />
                            }
                            label="Active"
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={isVerified}
                                    onChange={(e) => setIsVerified(e.target.checked)}
                                />
                            }
                            label="Email Verified"
                        />
                    </Stack>
                </Paper>

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={deleteDialogOpen}
                    onClose={handleDeleteCancel}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>Delete User</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Are you sure you want to delete this user? This action cannot be undone.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleDeleteCancel} color="primary">
                            Cancel
                        </Button>
                        <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
}
