import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Paper,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    FormControlLabel,
    Switch,
    Button,
    Stack,
    Alert,
    useTheme,
    InputAdornment,
    IconButton,
} from '@mui/material';
import { PersonAdd, ArrowBack, Visibility, VisibilityOff } from '@mui/icons-material';
import { getAuthHeader } from '../../utils/authUtils';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

export default function NewUser() {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('user');
    const [isActive, setIsActive] = useState(true);
    const [isVerified, setIsVerified] = useState(false);
    const [customerId, setCustomerId] = useState<number | null>(null);
    const [customers, setCustomers] = useState<Array<{ id: number; uuid: string; name: string }>>([]);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const fetchCustomers = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE}/api/admin/customers?page=1&per_page=100`, {
                headers: getAuthHeader(),
            });
            if (!response.ok) throw new Error('Failed to fetch customers');
            const data = await response.json();
            setCustomers(data.customers || []);
        } catch (err) {
            console.error('Failed to load customers:', err);
        }
    }, []);

    useEffect(() => {
        fetchCustomers();

        // Pre-populate customer from location state if provided
        const state = location.state as { customerId?: number; customerUuid?: string; customerName?: string } | null;
        if (state?.customerId) {
            setCustomerId(state.customerId);
            setRole('customer'); // Default to customer role when coming from customer page
        }
    }, [fetchCustomers, location.state]);

    const handleSubmit = async () => {
        if (!email || !password) {
            setError('Email and password are required');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            const response = await fetch(`${API_BASE}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader(),
                },
                body: JSON.stringify({
                    email,
                    password,
                    full_name: fullName || email,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Failed to create user');
            }

            const newUser = await response.json();

            // Update the user's role, active status, and verified status if needed
            if (role !== 'user' || !isActive || isVerified) {
                const updateResponse = await fetch(`${API_BASE}/api/admin/users/${newUser.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        ...getAuthHeader(),
                    },
                    body: JSON.stringify({
                        full_name: fullName || email,
                        role,
                        is_active: isActive,
                        is_verified: isVerified,
                        customer_id: customerId,
                    }),
                });

                if (!updateResponse.ok) {
                    throw new Error('User created but failed to update settings');
                }
            }

            // Navigate to the new user's detail page
            navigate(`/admin/users/${newUser.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create user');
        } finally {
            setSaving(false);
        }
    };

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
                <AdminBreadcrumbs items={[
                    { label: 'Users', path: '/admin/users' },
                    { label: 'New User' }
                ]} />

                {/* Header with Title */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
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
                        {(() => {
                            const state = location.state as { customerId?: number; customerUuid?: string; customerName?: string } | null;
                            return state?.customerName ? `New User for ${state.customerName}` : 'New User';
                        })()}
                    </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" mb={3}>
                    Create a new user account
                </Typography>

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

                    <Stack spacing={3}>
                        <TextField
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                            required
                            fullWidth
                        />

                        <TextField
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                            required
                            fullWidth
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                            aria-label="toggle password visibility"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            label="Full Name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                            fullWidth
                            helperText="Optional - defaults to email if not provided"
                        />

                        <FormControl fullWidth>
                            <InputLabel>Role</InputLabel>
                            <Select
                                value={role}
                                label="Role"
                                onChange={(e) => setRole(e.target.value)}
                                disabled={!!(location.state as { customerId?: number } | null)?.customerId}
                            >
                                <MenuItem value="user">User</MenuItem>
                                <MenuItem value="customer">Customer</MenuItem>
                                <MenuItem value="admin">Admin</MenuItem>
                                <MenuItem value="superadmin">Superadmin</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Customer</InputLabel>
                            <Select
                                value={customerId || ''}
                                label="Customer"
                                onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : null)}
                                disabled={!!(location.state as { customerId?: number } | null)?.customerId}
                            >
                                <MenuItem value="">None</MenuItem>
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
                            label="Verified"
                        />

                        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                            <Button
                                variant="outlined"
                                startIcon={<ArrowBack />}
                                onClick={() => navigate(-1)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<PersonAdd />}
                                onClick={handleSubmit}
                                disabled={saving}
                            >
                                {saving ? 'Creating...' : 'Create User'}
                            </Button>
                        </Stack>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}
