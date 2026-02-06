import { Box, Container, Stack, Link, Typography, IconButton, Tooltip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { DarkMode, LightMode } from '@mui/icons-material';
import { useThemeMode } from '../context/ThemeContext';

export default function Footer() {
    const { effectiveTheme, setThemeMode } = useThemeMode();

    const toggleTheme = () => {
        setThemeMode(effectiveTheme === 'dark' ? 'light' : 'dark');
    };

    // Dynamic copyright year calculation
    const getCopyrightYear = () => {
        const startYear = 2026;
        const currentYear = new Date().getFullYear();

        if (currentYear === startYear) {
            return `© ${startYear}`;
        } else if (currentYear === startYear + 1) {
            return `© ${startYear}, ${currentYear}`;
        } else {
            return `© ${startYear}-${currentYear}`;
        }
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
                py: 0.75,
                px: 2,
                background: 'rgba(15, 23, 42, 0.95)',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
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
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {getCopyrightYear()} DocuTok
                    </Typography>
                    <Stack direction="row" spacing={3} alignItems="center">
                        <Link
                            component={RouterLink}
                            to="/about"
                            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                            underline="hover"
                            variant="body2"
                        >
                            About
                        </Link>
                        <Link
                            component={RouterLink}
                            to="/contact"
                            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                            underline="hover"
                            variant="body2"
                        >
                            Contact
                        </Link>
                        <Link
                            component={RouterLink}
                            to="/faq"
                            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                            underline="hover"
                            variant="body2"
                        >
                            FAQ
                        </Link>
                        <Tooltip title={effectiveTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                            <IconButton
                                onClick={toggleTheme}
                                size="small"
                                sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                            >
                                {effectiveTheme === 'dark' ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
                            </IconButton>
                        </Tooltip>
                    </Stack>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        v0.1.0
                    </Typography>
                </Stack>
            </Container>
        </Box>
    );
}
