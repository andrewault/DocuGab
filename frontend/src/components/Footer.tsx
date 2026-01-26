import { Box, Container, Stack, Link, Typography, useTheme, IconButton, Tooltip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { DarkMode, LightMode } from '@mui/icons-material';
import { useThemeMode } from '../context/ThemeContext';

export default function Footer() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const { effectiveTheme, setThemeMode } = useThemeMode();

    const toggleTheme = () => {
        setThemeMode(effectiveTheme === 'dark' ? 'light' : 'dark');
    };

    return (
        <Box
            component="footer"
            sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                py: 2,
                px: 2,
                background: isDark
                    ? 'rgba(15, 23, 42, 0.95)'
                    : 'rgba(248, 250, 252, 0.95)',
                borderTop: isDark
                    ? '1px solid rgba(255, 255, 255, 0.1)'
                    : '1px solid rgba(0, 0, 0, 0.08)',
                backdropFilter: 'blur(10px)',
            }}
        >
            <Container maxWidth="lg">
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={2}
                >
                    <Typography variant="body2" color="text.secondary">
                        © {new Date().getFullYear()} DocuTok
                    </Typography>
                    <Stack direction="row" spacing={3} alignItems="center">
                        <Link
                            component={RouterLink}
                            to="/about"
                            color="text.secondary"
                            underline="hover"
                            variant="body2"
                        >
                            About
                        </Link>
                        <Link
                            component={RouterLink}
                            to="/contact"
                            color="text.secondary"
                            underline="hover"
                            variant="body2"
                        >
                            Contact
                        </Link>
                        <Link
                            component={RouterLink}
                            to="/faq"
                            color="text.secondary"
                            underline="hover"
                            variant="body2"
                        >
                            FAQ
                        </Link>
                        <Tooltip title={effectiveTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                            <IconButton
                                onClick={toggleTheme}
                                size="small"
                                sx={{ color: 'text.secondary' }}
                            >
                                {effectiveTheme === 'dark' ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
                            </IconButton>
                        </Tooltip>
                    </Stack>
                    <Typography variant="caption" color="text.disabled">
                        v0.1.0
                    </Typography>
                </Stack>
            </Container>
        </Box>
    );
}
