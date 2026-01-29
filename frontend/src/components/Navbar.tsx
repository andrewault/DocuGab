import { useState } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    IconButton,
    useTheme,
    Menu,
    MenuItem,
    Divider,
} from '@mui/material';
import {
    Description,
    Forum,
    Settings,
    AccountCircle,
    Menu as MenuIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
    sidebarOpen?: boolean;
    onToggleSidebar?: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
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
                bgcolor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.95)',
                color: isDark ? '#fff' : '#1e293b',
                backdropFilter: 'blur(10px)',
                borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                zIndex: (theme) => theme.zIndex.drawer + 1,
            }}
        >
            <Toolbar>
                {/* Admin Menu Toggle */}
                {isAdmin && (
                    <IconButton
                        color="inherit"
                        onClick={onToggleSidebar}
                        sx={{ mr: 2 }}
                        aria-label="toggle sidebar"
                    >
                        <MenuIcon />
                    </IconButton>
                )}

                {/* Logo / Brand */}
                <Box
                    component="div"
                    onClick={() => navigate('/')}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        gap: 1.5,
                        mr: 2,
                    }}
                >
                    <Box
                        component="img"
                        src="/assets/images/DocuTokLogo.png"
                        alt="DocuTok Logo"
                        sx={{
                            height: 32,
                            width: 'auto',
                        }}
                    />
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 700,
                            background: 'linear-gradient(90deg, #6366f1, #10b981)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        DocuTok
                    </Typography>
                </Box>

                {/* Left Spacer */}
                <Box sx={{ flexGrow: 1 }} />

                {/* Navigation Links - Centered */}
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
                    </>
                )}

                {/* Right Spacer */}
                <Box sx={{ flexGrow: 1 }} />

                {/* Right side icons - only when authenticated */}
                {isAuthenticated && (
                    <>
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
                            <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>
                                Profile
                            </MenuItem>
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
