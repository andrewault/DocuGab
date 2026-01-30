import { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
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
} from '@mui/material';
import { Folder, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAuthHeader } from '../../utils/authUtils';
import { formatInUserTimezone } from '../../utils/timezoneUtils';
import CustomerBreadcrumbs from '../../components/CustomerBreadcrumbs';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

interface Project {
    id: number;
    uuid: string;
    name: string;
    description: string | null;
    is_active: boolean;
    customer_id: number;
    created_at: string;
    updated_at: string;
}

export default function CustomerProjects() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProjects = useCallback(async () => {
        if (!user?.customer_id) {
            setError('No customer association found');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(
                `${API_BASE}/api/customer/projects`,
                { headers: getAuthHeader() }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch projects');
            }

            const data = await response.json();
            setProjects(data.projects || []);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load projects');
        } finally {
            setLoading(false);
        }
    }, [user?.customer_id]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

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
                {/* Breadcrumbs */}
                <CustomerBreadcrumbs items={[{ label: 'Projects' }]} />

                {/* Header */}
                <Box mb={4}>
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 700,
                            background: 'linear-gradient(90deg, #6366f1, #10b981)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 1,
                        }}
                    >
                        {user?.customer_name ? `${user.customer_name} Projects` : 'My Projects'}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        View and manage your projects
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {/* Projects Table */}
                <TableContainer
                    component={Paper}
                    elevation={3}
                    sx={{
                        borderRadius: 2,
                        bgcolor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'background.paper',
                    }}
                >
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Folder fontSize="small" />
                                        Project Name
                                    </Box>
                                </TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Created</TableCell>
                                <TableCell>Updated</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {projects.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                        <Typography variant="body1" color="text.secondary">
                                            No projects found
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                projects.map((project) => (
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
                                        onClick={() => navigate(`/customer/${user?.customer_uuid}/projects/${project.uuid}`)}
                                    >
                                        <TableCell>
                                            <Typography variant="body1" fontWeight={600}>
                                                {project.name}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                    maxWidth: 400,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {project.description || 'No description'}
                                            </Typography>
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
                                                {formatInUserTimezone(project.created_at, user?.timezone || 'UTC')}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {formatInUserTimezone(project.updated_at, user?.timezone || 'UTC')}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/customer/${user?.customer_uuid}/projects/${project.uuid}`);
                                                }}
                                            >
                                                <Visibility fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Container>
        </Box>
    );
}
