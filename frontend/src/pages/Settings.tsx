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
} from '@mui/material';
import { DarkMode, LightMode, SettingsBrightness } from '@mui/icons-material';
import { useThemeMode } from '../context/ThemeContext';

export default function Settings() {
    const { themeMode, setThemeMode } = useThemeMode();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

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
                </Paper>
            </Container>
        </Box>
    );
}
