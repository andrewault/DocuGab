
import { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Avatar,
    Button,
    TextField,
    Stack,
    Alert,
    Divider,
    useTheme,
    CircularProgress,
} from '@mui/material';
import { Person, Edit, Lock } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

export default function Profile() {
    const { user, refreshAuth } = useAuth();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [editing, setEditing] = useState(false);
    const [fullName, setFullName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Password change state
    const [changingPassword, setChangingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        if (user) {
            setFullName(user.full_name || '');
            setAvatarUrl(user.avatar_url || '');
        }
    }, [user]);

    const handleSaveProfile = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const accessToken = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE}/api/users/me`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    full_name: fullName || null,
                    avatar_url: avatarUrl || null,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            await refreshAuth();
            setSuccess('Profile updated successfully');
            setEditing(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const accessToken = localStorage.getItem('access_token');
            const response = await fetch(`${API_BASE}/api/users/me/password`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Failed to change password');
            }

            setSuccess('Password changed successfully');
            setChangingPassword(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Password change failed');
        } finally {
            setSaving(false);
        }
    };

    if (!user) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <CircularProgress />
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
                pt: 12,
                pb: 8,
            }}
        >
            <Container maxWidth="md">
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                    <Person sx={{ fontSize: 32, color: '#6366f1' }} />
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
                        Profile
                    </Typography>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>{success}</Alert>}

                {/* Profile Card */}
                <Paper
                    sx={{
                        p: 4,
                        bgcolor: isDark ? '#2A3445' : 'background.paper',
                        borderRadius: 2,
                    }}
                >
                    <Stack spacing={4}>
                        {/* Avatar and Basic Info */}
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
                            <Avatar
                                src={avatarUrl || undefined}
                                sx={{ width: 100, height: 100, bgcolor: 'primary.main', fontSize: 40 }}
                            >
                                {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h5" fontWeight={600}>
                                    {user.full_name || 'No name set'}
                                </Typography>
                                <Typography color="text.secondary">{user.email}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Role: {user.role} • {user.is_verified ? 'Verified' : 'Not verified'}
                                </Typography>
                            </Box>
                            {!editing && !changingPassword && (
                                <Button variant="outlined" startIcon={<Edit />} onClick={() => setEditing(true)}>
                                    Edit Profile
                                </Button>
                            )}
                        </Stack>

                        <Divider />

                        {/* Edit Form */}
                        {editing && (
                            <Stack spacing={3}>
                                <Typography variant="h6">Edit Profile</Typography>
                                <TextField
                                    label="Full Name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    fullWidth
                                />
                                <TextField
                                    label="Avatar URL"
                                    value={avatarUrl}
                                    onChange={(e) => setAvatarUrl(e.target.value)}
                                    fullWidth
                                    helperText="Enter a URL to an image for your avatar"
                                />
                                <Stack direction="row" spacing={2}>
                                    <Button variant="contained" onClick={handleSaveProfile} disabled={saving}>
                                        {saving ? <CircularProgress size={20} /> : 'Save Changes'}
                                    </Button>
                                    <Button variant="outlined" onClick={() => setEditing(false)} disabled={saving}>
                                        Cancel
                                    </Button>
                                </Stack>
                            </Stack>
                        )}

                        {/* Change Password Section */}
                        {!editing && !changingPassword && (
                            <Button
                                variant="outlined"
                                startIcon={<Lock />}
                                onClick={() => setChangingPassword(true)}
                                sx={{ alignSelf: 'flex-start' }}
                            >
                                Change Password
                            </Button>
                        )}

                        {changingPassword && (
                            <Stack spacing={3}>
                                <Typography variant="h6">Change Password</Typography>
                                <TextField
                                    label="Current Password"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    fullWidth
                                />
                                <TextField
                                    label="New Password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    fullWidth
                                />
                                <TextField
                                    label="Confirm New Password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    fullWidth
                                />
                                <Stack direction="row" spacing={2}>
                                    <Button variant="contained" onClick={handleChangePassword} disabled={saving}>
                                        {saving ? <CircularProgress size={20} /> : 'Update Password'}
                                    </Button>
                                    <Button variant="outlined" onClick={() => setChangingPassword(false)} disabled={saving}>
                                        Cancel
                                    </Button>
                                </Stack>
                            </Stack>
                        )}
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}
