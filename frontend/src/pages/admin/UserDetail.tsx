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
    Divider,
    useTheme,
} from '@mui/material';
import { Save, Delete } from '@mui/icons-material';
import { getAuthHeader } from '../../utils/authUtils';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';

interface User {
    id: number;
    email: string;
    full_name: string | null;
    role: string;
    is_active: boolean;
    is_verified: boolean;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

export default function UserDetail() {
    const { id } = useParams<{ id: string }>();
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
            const response = await fetch(`${API_BASE}/api/admin/users/${id}`, {
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
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load user');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            const response = await fetch(`${API_BASE}/api/admin/users/${id}`, {
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
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Failed to update user');
            }

            const updatedUser = await response.json();
            setUser(updatedUser);
            setSuccess('User updated successfully');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update user');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) {
            return;
        }

        try {
            setSaving(true);
            const response = await fetch(`${API_BASE}/api/admin/users/${id}`, {
                method: 'DELETE',
                headers: getAuthHeader(),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Failed to delete user');
            }

            navigate('/admin');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete user');
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
                <AdminBreadcrumbs items={[
                    { label: 'Users', path: '/admin/users' },
                    { label: user.email }
                ]} />

                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        borderRadius: 2,
                        bgcolor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'background.paper',
                    }}
                >
                    <Typography
                        variant="h4"
                        mb={1}
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
                    <Typography variant="body2" color="text.secondary" mb={3}>
                        {user.email}
                    </Typography>

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
                                <MenuItem value="admin">Admin</MenuItem>
                                <MenuItem value="superadmin">Superadmin</MenuItem>
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

                        <Divider />

                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<Delete />}
                            onClick={handleDelete}
                            disabled={saving}
                        >
                            Delete User
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}
