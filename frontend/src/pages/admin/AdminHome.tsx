import { Box, Container, Typography, Paper, Stack, useTheme } from '@mui/material';
import { Group, QuestionAnswer, Business, Folder } from '@mui/icons-material';
import { Link } from 'react-router-dom';

export default function AdminHome() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const adminLinks = [
        {
            title: 'Users',
            description: 'Manage user accounts, roles, and permissions',
            icon: <Group sx={{ fontSize: 48 }} />,
            path: '/admin/users',
        },
        {
            title: 'Customers',
            description: 'Manage customer organizations and their projects',
            icon: <Business sx={{ fontSize: 48 }} />,
            path: '/admin/customers',
        },
        {
            title: 'Projects',
            description: 'Manage projects with branding and configuration',
            icon: <Folder sx={{ fontSize: 48 }} />,
            path: '/admin/projects',
        },
        {
            title: 'FAQs',
            description: 'Create and manage frequently asked questions',
            icon: <QuestionAnswer sx={{ fontSize: 48 }} />,
            path: '/admin/faq',
        },
    ];

    return (
        <Box
            sx={{
                minHeight: '100vh',
                py: 4,
                background: isDark
                    ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
                    : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
            }}
        >
            <Container maxWidth="md">
                <Typography
                    variant="h4"
                    mb={4}
                    sx={{
                        fontWeight: 700,
                        background: 'linear-gradient(90deg, #6366f1, #10b981)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}
                >
                    Admin Dashboard
                </Typography>

                <Stack spacing={3}>
                    {adminLinks.map((link) => (
                        <Paper
                            key={link.path}
                            component={Link}
                            to={link.path}
                            elevation={0}
                            sx={{
                                p: 3,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                                textDecoration: 'none',
                                color: 'inherit',
                                background: isDark
                                    ? 'rgba(255, 255, 255, 0.05)'
                                    : 'rgba(255, 255, 255, 0.8)',
                                backdropFilter: 'blur(10px)',
                                border: isDark
                                    ? '1px solid rgba(255, 255, 255, 0.1)'
                                    : '1px solid rgba(0, 0, 0, 0.08)',
                                borderRadius: 3,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: isDark
                                        ? '0 12px 40px rgba(99, 102, 241, 0.2)'
                                        : '0 12px 40px rgba(99, 102, 241, 0.15)',
                                    borderColor: 'primary.main',
                                },
                            }}
                        >
                            <Box sx={{ color: 'primary.main' }}>
                                {link.icon}
                            </Box>
                            <Box>
                                <Typography variant="h6" fontWeight={600}>
                                    {link.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {link.description}
                                </Typography>
                            </Box>
                        </Paper>
                    ))}
                </Stack>
            </Container>
        </Box>
    );
}
