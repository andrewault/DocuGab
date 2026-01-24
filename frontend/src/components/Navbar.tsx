import { AppBar, Toolbar, Typography, Button, Box, IconButton, useTheme, Menu, MenuItem, Divider } from '@mui/material';
import { Description, Forum, Settings, AdminPanelSettings, AccountCircle } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const { user, isAuthenticated, isAdmin, logout } = useAuth();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleUserMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        handleClose();
        logout();
        navigate('/');
    };

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

                {/* Navigation Links - Only show when authenticated */}
                {isAuthenticated && (
                    <>
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

                        {/* Admin Link */}
                        {isAdmin && (
                            <Button
                                color="inherit"
                                startIcon={<AdminPanelSettings />}
                                onClick={() => navigate('/admin')}
                                sx={{
                                    mx: 1,
                                    opacity: location.pathname.startsWith('/admin') ? 1 : 0.7,
                                    '&:hover': { opacity: 1 },
                                }}
                            >
                                Admin
                            </Button>
                        )}

                        {/* Settings Icon */}
                        <IconButton
                            color="inherit"
                            onClick={() => navigate('/settings')}
                            sx={{
                                ml: 1,
                                opacity: location.pathname === '/settings' ? 1 : 0.7,
                                '&:hover': { opacity: 1 },
                            }}
                        >
                            <Settings />
                        </IconButton>

                        {/* User Menu */}
                        <IconButton
                            color="inherit"
                            onClick={handleUserMenu}
                            sx={{ ml: 1 }}
                        >
                            <AccountCircle />
                        </IconButton>
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        >
                            <MenuItem disabled>
                                <Typography variant="body2" color="text.secondary">
                                    {user?.email}
                                </Typography>
                            </MenuItem>
                            <Divider />
                            <MenuItem onClick={handleLogout}>Logout</MenuItem>
                        </Menu>
                    </>
                )}

                {/* Login/Register buttons when not authenticated */}
                {!isAuthenticated && (
                    <>
                        <Button
                            color="inherit"
                            onClick={() => navigate('/login')}
                            sx={{ mx: 1 }}
                        >
                            Sign In
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => navigate('/register')}
                            sx={{
                                background: 'linear-gradient(90deg, #6366f1, #4f46e5)',
                                '&:hover': {
                                    background: 'linear-gradient(90deg, #4f46e5, #4338ca)',
                                },
                            }}
                        >
                            Sign Up
                        </Button>
                    </>
                )}
            </Toolbar>
        </AppBar>
    );
}
