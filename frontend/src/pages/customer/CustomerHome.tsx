import { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Card,
    CardContent,
    Button,
    Stack,
    useTheme,
} from '@mui/material';
import {
    Description,
    Chat,
    Upload,
    TrendingUp,
    Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAuthHeader } from '../../utils/authUtils';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

interface Stats {
    total_documents: number;
    recent_chats: number;
}

export default function CustomerHome() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [stats, setStats] = useState<Stats>({ total_documents: 0, recent_chats: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return;

            try {
                // Fetch document count
                const docsResponse = await fetch(`${API_BASE}/api/documents?page=1&per_page=1`, {
                    headers: getAuthHeader(),
                });
                if (docsResponse.ok) {
                    const docsData = await docsResponse.json();
                    setStats(prev => ({ ...prev, total_documents: docsData.total || 0 }));
                }
            } catch (err) {
                console.error('Failed to fetch stats:', err);
            }
        };

        if (user) {
            fetchStats();
        }
    }, [user]);

    const StatCard = ({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) => (
        <Card sx={{ bgcolor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'background.paper' }}>
            <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Box>
                        <Typography color="text.secondary" variant="body2">
                            {title}
                        </Typography>
                        <Typography variant="h4" fontWeight={700}>
                            {value}
                        </Typography>
                    </Box>
                    <Box sx={{ color: 'primary.main' }}>
                        {icon}
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );

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
            <Container maxWidth={false} sx={{ px: 3 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                    <DashboardIcon sx={{ fontSize: 32, color: '#6366f1' }} />
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
                        Dashboard
                    </Typography>
                </Box>

                {/* Stats Cards */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} mb={4}>
                    <Box sx={{ flex: 1 }}>
                        <StatCard
                            title="Total Documents"
                            value={stats.total_documents}
                            icon={<Description sx={{ fontSize: 40 }} />}
                        />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <StatCard
                            title="Recent Activity"
                            value={stats.recent_chats}
                            icon={<TrendingUp sx={{ fontSize: 40 }} />}
                        />
                    </Box>
                </Stack>

                {/* Quick Actions */}
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        mb: 4,
                        borderRadius: 2,
                        bgcolor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'background.paper',
                    }}
                >
                    <Typography variant="h6" gutterBottom fontWeight={600}>
                        Quick Actions
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mt={2}>
                        <Button
                            variant="contained"
                            startIcon={<Upload />}
                            onClick={() => navigate('/documents')}
                            sx={{
                                background: 'linear-gradient(90deg, #6366f1, #4f46e5)',
                                '&:hover': {
                                    background: 'linear-gradient(90deg, #4f46e5, #4338ca)',
                                },
                            }}
                        >
                            Upload Document
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<Chat />}
                            onClick={() => navigate('/chat')}
                        >
                            Start Chat
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<Description />}
                            onClick={() => navigate('/documents')}
                        >
                            View Documents
                        </Button>
                    </Stack>
                </Paper>

                {/* Getting Started */}
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        borderRadius: 2,
                        bgcolor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'background.paper',
                    }}
                >
                    <Typography variant="h6" gutterBottom fontWeight={600}>
                        Getting Started
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        Welcome to your customer portal! Here you can:
                    </Typography>
                    <Stack spacing={1}>
                        <Typography variant="body2">
                            • Upload and manage your documents
                        </Typography>
                        <Typography variant="body2">
                            • Chat with our AI assistant about your documents
                        </Typography>
                        <Typography variant="body2">
                            • Update your profile and settings
                        </Typography>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}
