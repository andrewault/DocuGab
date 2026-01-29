import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Divider, useTheme } from '@mui/material';
import { Business, Folder, Group, QuestionAnswer } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

interface AdminSidebarProps {
    isOpen: boolean;
}

export default function AdminSidebar({ isOpen }: AdminSidebarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const adminNavItems = [
        { label: 'Customers', icon: <Business />, path: '/admin/customers' },
        { label: 'Projects', icon: <Folder />, path: '/admin/projects' },
        { label: 'Users', icon: <Group />, path: '/admin/users' },
        { label: 'FAQs', icon: <QuestionAnswer />, path: '/admin/faq' },
    ];

    return (
        <Box
            sx={{
                width: isOpen ? 280 : 0,
                flexShrink: 0,
                background: isDark
                    ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
                    : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
                borderRight: isOpen
                    ? isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)'
                    : 'none',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                transition: 'width 225ms cubic-bezier(0.4, 0, 0.6, 1)',
            }}
        >
            <Box sx={{ p: 2, minWidth: 280 }}>
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 700,
                        background: 'linear-gradient(90deg, #6366f1, #10b981)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        whiteSpace: 'nowrap',
                    }}
                >
                    Admin Panel
                </Typography>
            </Box>
            <Divider sx={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', minWidth: 280 }} />
            <List sx={{ minWidth: 280 }}>
                {adminNavItems.map((item) => (
                    <ListItem key={item.path} disablePadding>
                        <ListItemButton
                            onClick={() => navigate(item.path)}
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
        </Box>
    );
}
