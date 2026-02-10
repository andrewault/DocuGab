import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { PersonAdd, Visibility, VisibilityOff } from '@mui/icons-material';
import { getAuthHeader } from '../../utils/authUtils';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';
import { getAllTimezones, getTimezoneLabel } from '../../utils/timezoneUtils';
import { API_BASE } from '@/config/api';

export default function NewUser() {
    const navigate = useNavigate();

    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('admin');
    const [isActive, setIsActive] = useState(true);
    const [isVerified, setIsVerified] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [company, setCompany] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [timezone, setTimezone] = useState('America/Los_Angeles');
    const timezones = getAllTimezones();



    const handleSubmit = async () => {
        if (!email || !password) {
            setError('Email and password are required');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        try {
            setSaving(true);
            setError(null);

            const response = await fetch(`${API_BASE}/api/v1/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader(),
                },
                body: JSON.stringify({
                    email,
                    password,
                    full_name: fullName || email,
                    phone_number: phoneNumber || null,
                    company: company || null,
                    job_title: jobTitle || null,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                // Handle validation errors from FastAPI
                if (data.detail && Array.isArray(data.detail)) {
                    const errors = data.detail.map((err: { msg: string }) => err.msg).join(', ');
                    throw new Error(errors);
                }
                throw new Error(data.detail || 'Failed to create user');
            }

            const newUser = await response.json();

            // Update the user's role, active status, verified status if needed
            if (role !== 'user' || !isActive || isVerified) {
                const updateResponse = await fetch(`${API_BASE}/api/v1/admin/users/${newUser.uuid}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        ...getAuthHeader(),
                    },
                    body: JSON.stringify({
                        role,
                        is_active: isActive,
                        is_verified: isVerified,
                        customer_id: null,
                        phone_number: phoneNumber || null,
                        company: company || null,
                        job_title: jobTitle || null,
                        timezone: timezone,
                    }),
                });

                if (!updateResponse.ok) {
                    const updateData = await updateResponse.json().catch(() => ({}));
                    throw new Error(updateData.detail || 'User created but failed to update settings');
                }
            }

            navigate(`/admin/admin-users/${newUser.uuid}`);
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
                    { label: 'Admin Users', path: '/admin/admin-users' },
                    { label: 'New Admin User' }
                ]} />

                {/* Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <PersonAdd sx={{ fontSize: 32, color: '#6366f1' }} />
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
                            New Admin User
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="outlined"
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
                            {saving ? 'Creating...' : 'Create Admin User'}
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
                            helperText="Minimum 8 characters"
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
                            >
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
                                {timezones.map((tz) => (
                                    <MenuItem key={tz} value={tz}>
                                        {getTimezoneLabel(tz)}
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
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}
