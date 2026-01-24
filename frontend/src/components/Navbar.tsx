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
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import {
    Description,
    Forum,
    Settings,
    AccountCircle,
    Menu as MenuIcon,
    Group,
    QuestionAnswer,
    Close,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const { user, isAuthenticated, isAdmin, logout } = useAuth();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

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

    const handleDrawerNav = (path: string) => {
        navigate(path);
        setDrawerOpen(false);
    };

    const adminNavItems = [
        { label: 'Users', icon: <Group />, path: '/admin/users' },
        { label: 'FAQs', icon: <QuestionAnswer />, path: '/admin/faq' },
    ];

    return (
        <>
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
                    {/* Admin Hamburger Menu */}
                    {isAdmin && (
                        <IconButton
                            color="inherit"
                            onClick={() => setDrawerOpen(true)}
                            sx={{ mr: 2 }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}

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

            {/* Admin Drawer */}
            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{
                    sx: {
                        width: 280,
                        background: isDark
                            ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
                            : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
                    },
                }}
            >
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                        Admin
                    </Typography>
                    <IconButton onClick={() => setDrawerOpen(false)} size="small">
                        <Close />
                    </IconButton>
                </Box>
                <Divider sx={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                <List>
                    {adminNavItems.map((item) => (
                        <ListItem key={item.path} disablePadding>
                            <ListItemButton
                                onClick={() => handleDrawerNav(item.path)}
                                selected={location.pathname === item.path}
                                sx={{
                                    '&.Mui-selected': {
                                        backgroundColor: isDark
                                            ? 'rgba(99, 102, 241, 0.2)'
                                            : 'rgba(99, 102, 241, 0.1)',
                                    },
                                }}
                            >
                                <ListItemIcon sx={{ color: 'primary.main' }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText primary={item.label} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Drawer>
        </>
    );
}
