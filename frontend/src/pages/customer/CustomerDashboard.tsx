import { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    CircularProgress,
    Alert,
    useTheme,
    IconButton,
    Button,
} from '@mui/material';
import {
    RecordVoiceOver,
    Description as DocumentIcon,
    Visibility,
    Forum,
    CloudUpload,
    Dashboard as DashboardIcon,
    HourglassEmpty,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAuthHeader } from '../../utils/authUtils';
import { formatInUserTimezone } from '../../utils/timezoneUtils';
import CustomerBreadcrumbs from '../../components/CustomerBreadcrumbs';
import InactiveCustomerBanner from '../../components/InactiveCustomerBanner';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

interface DashboardStats {
    total_projects: number;
    active_projects: number;
    total_documents: number;
    documents_processing: number;
    active_chats_7d: number;
}

interface RecentProject {
    id: number;
    uuid: string;
    name: string;
    is_active: boolean;
    documents_count: number;
    updated_at: string;
}

export default function CustomerDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboardData = useCallback(async () => {
        if (!user?.customer_id) {
            setError('No customer association found');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // Fetch projects to calculate stats and get recent projects
            const projectsResponse = await fetch(
                `${API_BASE}/api/customer/projects`,
                { headers: getAuthHeader() }
            );

            if (!projectsResponse.ok) {
                throw new Error('Failed to fetch projects');
            }

            const projectsData = await projectsResponse.json();
            const projects = projectsData.projects || [];

            // Calculate stats
            const activeProjects = projects.filter((p: RecentProject) => p.is_active).length;
            const totalDocuments = projects.reduce((sum: number, p: RecentProject) => sum + (p.documents_count || 0), 0);

            // For now, set processing and active chats to 0 (can be enhanced with API endpoints later)
            const dashboardStats: DashboardStats = {
                total_projects: projects.length,
                active_projects: activeProjects,
                total_documents: totalDocuments,
                documents_processing: 0, // TODO: Implement via API
                active_chats_7d: 0, // TODO: Implement via API
            };

            setStats(dashboardStats);

            // Get 5 most recent projects
            const sortedProjects = [...projects]
                .sort((a: RecentProject, b: RecentProject) =>
                    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
                )
                .slice(0, 5);

            setRecentProjects(sortedProjects);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    }, [user?.customer_id]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

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
                <InactiveCustomerBanner />
                {/* Breadcrumbs */}
                <CustomerBreadcrumbs items={[{ label: 'Dashboard' }]} />

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

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {/* Overview Stats Cards */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, 1fr)',
                            md: 'repeat(4, 1fr)',
                        },
                        gap: 3,
                        mb: 4,
                    }}
                >
                    <Card
                        elevation={3}
                        sx={{
                            bgcolor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'background.paper',
                            borderRadius: 2,
                        }}
                    >
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <RecordVoiceOver sx={{ color: '#6366f1', fontSize: 28 }} />
                                <Typography variant="h6" color="text.secondary">
                                    Total Projects
                                </Typography>
                            </Box>
                            <Typography variant="h3" fontWeight={700}>
                                {stats?.total_projects || 0}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {stats?.active_projects || 0} active
                            </Typography>
                        </CardContent>
                    </Card>

                    <Card
                        elevation={3}
                        sx={{
                            bgcolor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'background.paper',
                            borderRadius: 2,
                        }}
                    >
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <DocumentIcon sx={{ color: '#10b981', fontSize: 28 }} />
                                <Typography variant="h6" color="text.secondary">
                                    Total Documents
                                </Typography>
                            </Box>
                            <Typography variant="h3" fontWeight={700}>
                                {stats?.total_documents || 0}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Across all projects
                            </Typography>
                        </CardContent>
                    </Card>

                    <Card
                        elevation={3}
                        sx={{
                            bgcolor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'background.paper',
                            borderRadius: 2,
                        }}
                    >
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <HourglassEmpty sx={{ color: '#f59e0b', fontSize: 28 }} />
                                <Typography variant="h6" color="text.secondary">
                                    Processing
                                </Typography>
                            </Box>
                            <Typography variant="h3" fontWeight={700}>
                                {stats?.documents_processing || 0}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Documents in queue
                            </Typography>
                        </CardContent>
                    </Card>

                    <Card
                        elevation={3}
                        sx={{
                            bgcolor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'background.paper',
                            borderRadius: 2,
                        }}
                    >
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <Forum sx={{ color: '#8b5cf6', fontSize: 28 }} />
                                <Typography variant="h6" color="text.secondary">
                                    Active Chats
                                </Typography>
                            </Box>
                            <Typography variant="h3" fontWeight={700}>
                                {stats?.active_chats_7d || 0}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Last 7 days
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>

                {/* Recent Projects */}
                <Paper
                    elevation={3}
                    sx={{
                        p: 3,
                        borderRadius: 2,
                        bgcolor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'background.paper',
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h5" fontWeight={700}>
                            Recent Projects
                        </Typography>
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/customer/projects')}
                            sx={{ textTransform: 'none' }}
                        >
                            View All Projects
                        </Button>
                    </Box>

                    {recentProjects.length === 0 ? (
                        <Alert severity="info">
                            No projects found. Create your first chatbot project to get started!
                        </Alert>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <RecordVoiceOver fontSize="small" />
                                                Project Name
                                            </Box>
                                        </TableCell>
                                        <TableCell>Documents</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Last Updated</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {recentProjects.map((project) => (
                                        <TableRow
                                            key={project.uuid}
                                            hover
                                            sx={{
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    bgcolor: isDark
                                                        ? 'rgba(99, 102, 241, 0.1)'
                                                        : 'rgba(99, 102, 241, 0.05)',
                                                },
                                            }}
                                            onClick={() => navigate(`/customer/projects/${project.uuid}`)}
                                        >
                                            <TableCell>
                                                <Typography variant="body1" fontWeight={600}>
                                                    {project.name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    icon={<DocumentIcon />}
                                                    label={project.documents_count || 0}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={project.is_active ? 'Active' : 'Inactive'}
                                                    color={project.is_active ? 'success' : 'default'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {formatInUserTimezone(project.updated_at, user?.timezone || 'UTC')}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/customer/projects/${project.uuid}`);
                                                        }}
                                                        title="View"
                                                    >
                                                        <Visibility fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/customer/projects/${project.uuid}/test`);
                                                        }}
                                                        title="Test"
                                                    >
                                                        <Forum fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/customer/projects/${project.uuid}/documents/new`);
                                                        }}
                                                        title="Upload Document"
                                                    >
                                                        <CloudUpload fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>
            </Container>
        </Box>
    );
}
