import { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    useTheme,
    Autocomplete,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Divider,
    Stack,
} from '@mui/material';
import { DarkMode, LightMode, SettingsBrightness, Save, Public } from '@mui/icons-material';
import { useThemeMode } from '../context/ThemeContext';
import { getAllTimezones, getTimezoneLabel } from '../utils/timezoneUtils';
import { getAuthHeader } from '../utils/authUtils';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

export default function Settings() {
    const { themeMode, setThemeMode } = useThemeMode();
    const { user, updateUser } = useAuth();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [selectedTimezone, setSelectedTimezone] = useState('America/Los_Angeles');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const timezones = getAllTimezones();

    // Load current settings from user
    useEffect(() => {
        if (user?.timezone) {
            setSelectedTimezone(user.timezone);
        }
        if (user?.theme) {
            setThemeMode(user.theme as 'light' | 'dark' | 'system');
        }
    }, [user, setThemeMode]);

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            const response = await fetch(`${API_BASE}/api/users/me/settings`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader(),
                },
                body: JSON.stringify({
                    theme: themeMode,
                    timezone: selectedTimezone,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Failed to update settings');
            }

            const updatedUser = await response.json();
            updateUser(updatedUser);
            setSuccess('Settings saved successfully!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update settings');
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
            <Container maxWidth="md">
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 700,
                        mb: 4,
                        background: 'linear-gradient(90deg, #6366f1, #10b981)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}
                >
                    Settings
                </Typography>

                <Paper sx={{ p: 4, bgcolor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'background.paper' }}>
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

                    <Stack spacing={4}>
                        {/* Theme Selection */}
                        <FormControl component="fieldset">
                            <FormLabel
                                component="legend"
                                sx={{
                                    color: 'text.primary',
                                    fontWeight: 600,
                                    fontSize: '1.1rem',
                                    mb: 2,
                                }}
                            >
                                Theme
                            </FormLabel>
                            <RadioGroup
                                value={themeMode}
                                onChange={(e) => setThemeMode(e.target.value as 'light' | 'dark' | 'system')}
                            >
                                <FormControlLabel
                                    value="system"
                                    control={<Radio />}
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <SettingsBrightness fontSize="small" />
                                            <span>System</span>
                                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                                (follows your device settings)
                                            </Typography>
                                        </Box>
                                    }
                                />
                                <FormControlLabel
                                    value="dark"
                                    control={<Radio />}
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <DarkMode fontSize="small" />
                                            <span>Dark</span>
                                        </Box>
                                    }
                                />
                                <FormControlLabel
                                    value="light"
                                    control={<Radio />}
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <LightMode fontSize="small" />
                                            <span>Light</span>
                                        </Box>
                                    }
                                />
                            </RadioGroup>
                        </FormControl>

                        <Divider />

                        {/* Timezone Selection */}
                        <FormControl component="fieldset">
                            <FormLabel
                                component="legend"
                                sx={{
                                    color: 'text.primary',
                                    fontWeight: 600,
                                    fontSize: '1.1rem',
                                    mb: 2,
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Public fontSize="small" />
                                    <span>Timezone</span>
                                </Box>
                            </FormLabel>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                All dates and times will be displayed in your selected timezone
                            </Typography>
                            <Autocomplete
                                value={selectedTimezone}
                                onChange={(event, newValue) => {
                                    if (newValue) {
                                        setSelectedTimezone(newValue);
                                    }
                                }}
                                options={timezones}
                                getOptionLabel={(option) => getTimezoneLabel(option)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Select Timezone"
                                        placeholder="Search timezones..."
                                    />
                                )}
                                sx={{ mt: 1 }}
                            />
                        </FormControl>

                        <Divider />

                        {/* Save Button */}
                        <Box>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
                                onClick={handleSave}
                                disabled={saving}
                                fullWidth
                            >
                                {saving ? 'Saving...' : 'Save Settings'}
                            </Button>
                        </Box>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}
