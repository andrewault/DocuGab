import { useState, useEffect } from 'react';
import { Box, Container, Typography, Stack, useTheme, Grid, Paper } from '@mui/material';
import { Dashboard } from '@mui/icons-material';
import { getAuthHeader } from '../../utils/authUtils';
import usePageTitle from '../../hooks/usePageTitle';
import { API_BASE } from '@/config/api';
import { QuickActions } from '../../components/admin/QuickActions';
import { HealthWidget } from '../../components/admin/HealthWidget';
import { RecentActivityWidget } from '../../components/admin/RecentActivityWidget';
import { Link } from 'react-router-dom';
import { Business, Group, QuestionAnswer, Storage, RecordVoiceOver } from '@mui/icons-material';

interface AdminStats {
    total_users: number;
    total_customers: number;
    total_projects: number;
    total_documents: number;
}

const StatCard = ({ label, value }: { label: string, value: number }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'background.paper',
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
                textAlign: 'center'
            }}
        >
            <Typography variant="h4" fontWeight={700} color="primary.main">
                {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {label}
            </Typography>
        </Paper>
    );
};


export default function AdminHome() {


    usePageTitle('Admin Dashboard');
    const [stats, setStats] = useState<AdminStats | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/v1/admin/stats`, {
                    headers: getAuthHeader(),
                });
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Failed to fetch admin stats:', error);
            }
        };
        fetchStats();
    }, []);

    const adminLinks = [
        { title: 'Customers', icon: <Business />, path: '/admin/customers' },
        { title: 'Projects', icon: <RecordVoiceOver />, path: '/admin/projects' },
        { title: 'Admin Users', icon: <Group />, path: '/admin/admin-users' },
        { title: 'FAQs', icon: <QuestionAnswer />, path: '/admin/faq' },
        { title: 'Database', icon: <Storage />, path: '/admin/database' },
    ];



    return (
        <Box
            sx={{
                minHeight: '100vh',
                py: 4,
                background: 'background.default',
            }}
        >
            <Container maxWidth="xl" sx={{ px: 3 }}>
                {/* Header */}
                <Stack direction="row" alignItems="center" spacing={2} mb={4}>
                    <Dashboard sx={{ fontSize: 32, color: '#6366f1' }} />
                    <Typography
                        variant="h4"
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
                </Stack>

                <QuickActions />

                {/* Main Dashboard Grid */}
                <Grid container spacing={3}>
                    {/* Left Column: Stats & Activity */}
                    <Grid size={{ xs: 12, lg: 8 }}>
                        <Stack spacing={3}>
                            {/* Stats Row */}
                            {stats && (
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 6, sm: 3 }}>
                                        <StatCard label="Customers" value={stats.total_customers} />
                                    </Grid>
                                    <Grid size={{ xs: 6, sm: 3 }}>
                                        <StatCard label="Projects" value={stats.total_projects} />
                                    </Grid>
                                    <Grid size={{ xs: 6, sm: 3 }}>
                                        <StatCard label="Documents" value={stats.total_documents} />
                                    </Grid>
                                    <Grid size={{ xs: 6, sm: 3 }}>
                                        <StatCard label="Users" value={stats.total_users} />
                                    </Grid>
                                </Grid>
                            )}

                            {/* Recent Activity */}
                            <Box sx={{ height: 500 }}>
                                <RecentActivityWidget />
                            </Box>
                        </Stack>
                    </Grid>

                    {/* Right Column: Health & Links */}
                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Stack spacing={3}>
                            <HealthWidget />

                            {/* Quick Links */}
                            <Paper sx={{ p: 0, overflow: 'hidden' }}>
                                <Typography variant="subtitle1" fontWeight={600} sx={{ p: 2, bgcolor: 'action.hover' }}>
                                    Quick Links
                                </Typography>
                                <Stack divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}>
                                    {adminLinks.map((link) => (
                                        <Box
                                            key={link.path}
                                            component={Link}
                                            to={link.path}
                                            sx={{
                                                p: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                textDecoration: 'none',
                                                color: 'text.primary',
                                                transition: 'background-color 0.2s',
                                                '&:hover': { bgcolor: 'action.hover' }
                                            }}
                                        >
                                            <Box sx={{ color: 'primary.main' }}>{link.icon}</Box>
                                            <Typography variant="body2" fontWeight={500}>
                                                {link.title}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Paper>
                        </Stack>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}
