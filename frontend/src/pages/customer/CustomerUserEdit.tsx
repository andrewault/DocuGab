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
    Alert,
    CircularProgress,
    Stack,
    useTheme,
} from '@mui/material';
import { Save } from '@mui/icons-material';
import { getAuthHeader } from '../../utils/authUtils';
import CustomerBreadcrumbs from '../../components/CustomerBreadcrumbs';
import InactiveCustomerBanner from '../../components/InactiveCustomerBanner';

interface AccountUser {
    id: number;
    uuid: string;
    email: string;
    full_name: string | null;
    customer_role: string | null;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

export default function CustomerUserEdit() {
    const { uuid } = useParams<{ uuid: string }>();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [user, setUser] = useState<AccountUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [fullName, setFullName] = useState('');
    const [customerRole, setCustomerRole] = useState('member');

    // Escape key to go back
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                navigate(`/customer/account/users/${uuid}`);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate, uuid]);

    const fetchUser = useCallback(async () => {
        try {
            setLoading(true);
            // Fetch from account endpoint to get all users
            const response = await fetch(`${API_BASE}/api/v1/customer/account`, {
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
            setFullName(targetUser.full_name || '');
            setCustomerRole(targetUser.customer_role || 'member');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load user');
        } finally {
            setLoading(false);
        }
    }, [uuid]);

    useEffect(() => {
        if (uuid) {
            fetchUser();
        }
    }, [fetchUser, uuid]);

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);

            // Update full name via the user info endpoint
            const infoResponse = await fetch(`${API_BASE}/api/v1/customer/account/users/${uuid}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader(),
                },
                body: JSON.stringify({
                    full_name: fullName,
                }),
            });

            if (!infoResponse.ok) {
                const data = await infoResponse.json();
                throw new Error(data.detail || 'Failed to update user information');
            }

            // Update role via API (placeholder for now)
            const roleResponse = await fetch(`${API_BASE}/api/v1/customer/account/users/${uuid}/role`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader(),
                },
                body: JSON.stringify({
                    customer_role: customerRole,
                }),
            });

            if (!roleResponse.ok) {
                const data = await roleResponse.json();
                throw new Error(data.detail || 'Failed to update user role');
            }

            // Navigate to detail page after successful save
            navigate(`/customer/account/users/${uuid}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update user');
        } finally {
            setSaving(false);
        }
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
                <InactiveCustomerBanner />
                <CustomerBreadcrumbs items={[
                    { label: 'Account', path: '/customer/account' },
                    { label: user.email, path: `/customer/account/users/${uuid}` },
                    { label: 'Edit' }
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
                        Edit User
                    </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" mb={3}>
                    {user.email}
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
                                value={customerRole}
                                label="Role"
                                onChange={(e) => setCustomerRole(e.target.value)}
                            >
                                <MenuItem value="member">Member</MenuItem>
                                <MenuItem value="owner">Owner</MenuItem>
                            </Select>
                        </FormControl>



                        <Button
                            variant="contained"
                            startIcon={<Save />}
                            onClick={handleSave}
                            disabled={saving}
                            sx={{
                                background: 'linear-gradient(90deg, #6366f1, #4f46e5)',
                                '&:hover': {
                                    background: 'linear-gradient(90deg, #4f46e5, #4338ca)',
                                },
                            }}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}
