import { AppBar, Toolbar, Typography, Button, Box, IconButton, useTheme } from '@mui/material';
import { Description, Forum, Settings } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    return (
        <AppBar
            position="fixed"
            elevation={0}
            sx={{
                bgcolor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
                borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            }}
        >
            <Toolbar>
                {/* Logo / Brand */}
                <Typography
                    variant="h6"
                    onClick={() => navigate('/')}
                    sx={{
                        cursor: 'pointer',
                        fontWeight: 700,
                        background: 'linear-gradient(90deg, #6366f1, #10b981)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mr: 4,
                    }}
                >
                    DocuGab
                </Typography>

                {/* Spacer */}
                <Box sx={{ flexGrow: 1 }} />

                {/* Navigation Links */}
                <Button
                    color="inherit"
                    startIcon={<Description />}
                    onClick={() => navigate('/documents')}
                    sx={{
                        mx: 1,
                        opacity: location.pathname === '/documents' ? 1 : 0.7,
                        '&:hover': { opacity: 1 },
                    }}
                >
                    Documents
                </Button>
                <Button
                    color="inherit"
                    startIcon={<Forum />}
                    onClick={() => navigate('/chat')}
                    sx={{
                        mx: 1,
                        opacity: location.pathname === '/chat' ? 1 : 0.7,
                        '&:hover': { opacity: 1 },
                    }}
                >
                    Chat
                </Button>

                {/* Settings Icon */}
                <IconButton
                    color="inherit"
                    onClick={() => navigate('/settings')}
                    sx={{
                        ml: 2,
                        opacity: location.pathname === '/settings' ? 1 : 0.7,
                        '&:hover': { opacity: 1 },
                    }}
                >
                    <Settings />
                </IconButton>
            </Toolbar>
        </AppBar>
    );
}
