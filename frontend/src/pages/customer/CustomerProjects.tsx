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
    TableSortLabel,
    Chip,
    CircularProgress,
    Alert,
    useTheme,
    IconButton,
} from '@mui/material';
import { RecordVoiceOver, Visibility } from '@mui/icons-material';
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
    const [orderBy, setOrderBy] = useState<keyof Project>('name');
    const [order, setOrder] = useState<'asc' | 'desc'>('asc');

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
                <CustomerBreadcrumbs items={[{ label: 'Chatbot Projects' }]} />

                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                    <RecordVoiceOver sx={{ fontSize: 32, color: '#6366f1' }} />
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
                        Chatbot Projects
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {/* Chatbot Projects Table */}
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
                                    <TableSortLabel
                                        active={orderBy === 'name'}
                                        direction={orderBy === 'name' ? order : 'asc'}
                                        onClick={() => {
                                            const isAsc = orderBy === 'name' && order === 'asc';
                                            setOrder(isAsc ? 'desc' : 'asc');
                                            setOrderBy('name');
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <RecordVoiceOver fontSize="small" />
                                            Chatbot Project Name
                                        </Box>
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>
                                    <TableSortLabel
                                        active={orderBy === 'created_at'}
                                        direction={orderBy === 'created_at' ? order : 'asc'}
                                        onClick={() => {
                                            const isAsc = orderBy === 'created_at' && order === 'asc';
                                            setOrder(isAsc ? 'desc' : 'asc');
                                            setOrderBy('created_at');
                                        }}
                                    >
                                        Created
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>
                                    <TableSortLabel
                                        active={orderBy === 'updated_at'}
                                        direction={orderBy === 'updated_at' ? order : 'asc'}
                                        onClick={() => {
                                            const isAsc = orderBy === 'updated_at' && order === 'asc';
                                            setOrder(isAsc ? 'desc' : 'asc');
                                            setOrderBy('updated_at');
                                        }}
                                    >
                                        Updated
                                    </TableSortLabel>
                                </TableCell>
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
                                [...projects]
                                    .sort((a, b) => {
                                        const aVal = a[orderBy];
                                        const bVal = b[orderBy];
                                        if (aVal === null || aVal === undefined) return 1;
                                        if (bVal === null || bVal === undefined) return -1;
                                        if (typeof aVal === 'string' && typeof bVal === 'string') {
                                            return order === 'asc'
                                                ? aVal.localeCompare(bVal)
                                                : bVal.localeCompare(aVal);
                                        }
                                        if (aVal < bVal) return order === 'asc' ? -1 : 1;
                                        if (aVal > bVal) return order === 'asc' ? 1 : -1;
                                        return 0;
                                    })
                                    .map((project) => (
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
                                                        navigate(`/customer/projects/${project.uuid}`);
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
