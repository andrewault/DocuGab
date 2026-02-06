import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Chip,
    Alert,
    CircularProgress,
    Stack,
} from '@mui/material';
import { CheckCircle, PlayCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';

interface DemoProject {
    id: number;
    uuid: string;
    name: string;
    slug: string;
    customer_name: string | null;
    is_active_demo: boolean;
    is_enabled: boolean;
    created_at: string | null;
}

const API_BASE = import.meta.env.VITE_API_BASE || '';

export default function DemoProjects() {
    const navigate = useNavigate();
    const { accessToken } = useAuth();
    const [projects, setProjects] = useState<DemoProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activating, setActivating] = useState<string | null>(null);

    const fetchProjects = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/v1/admin/demo-projects/`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!response.ok) throw new Error('Failed to fetch demo projects');
            const data = await response.json();
            setProjects(data.projects);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, [accessToken]);

    const handleActivate = async (uuid: string) => {
        setActivating(uuid);
        try {
            const response = await fetch(`${API_BASE}/api/v1/admin/demo-projects/${uuid}/activate`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!response.ok) throw new Error('Failed to activate demo project');
            await fetchProjects();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setActivating(null);
        }
    };

    const handleDeactivate = async (uuid: string) => {
        setActivating(uuid);
        try {
            const response = await fetch(`${API_BASE}/api/v1/admin/demo-projects/${uuid}/deactivate`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!response.ok) throw new Error('Failed to deactivate demo project');
            await fetchProjects();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setActivating(null);
        }
    };

    const activeProject = projects.find(p => p.is_active_demo);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <AdminBreadcrumbs items={[{ label: 'Demo Projects' }]} />
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <PlayCircle sx={{ fontSize: 32, color: '#6366f1' }} />
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
                        Demo Projects
                    </Typography>
                </Box>
            </Stack>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Active Demo Summary */}
            {activeProject ? (
                <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircle />}>
                    <Typography variant="subtitle2">
                        Active Demo: <strong>{activeProject.name}</strong>
                    </Typography>
                    <Typography variant="body2">
                        This project is displayed on the public /chat page.
                    </Typography>
                </Alert>
            ) : (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    <Typography variant="subtitle2">No Active Demo</Typography>
                    <Typography variant="body2">
                        The /chat page will show "No demo chat currently available"
                    </Typography>
                </Alert>
            )}

            {projects.length === 0 ? (
                <Alert severity="info">
                    <Typography variant="subtitle2">No Demo Projects Found</Typography>
                    <Typography variant="body2">
                        Mark a project as "Demo" in the project settings to make it available here.
                    </Typography>
                </Alert>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Customer</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {projects.map((project) => (
                                <TableRow
                                    key={project.uuid}
                                    hover
                                    sx={{ cursor: 'pointer' }}
                                    onClick={() => navigate(`/admin/projects/${project.uuid}`)}
                                >
                                    <TableCell>
                                        <Typography fontWeight={project.is_active_demo ? 700 : 400}>
                                            {project.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {project.customer_name || '—'}
                                    </TableCell>
                                    <TableCell>
                                        {project.is_active_demo ? (
                                            <Chip
                                                label="Active Demo"
                                                color="success"
                                                size="small"
                                                icon={<CheckCircle />}
                                            />
                                        ) : !project.is_enabled ? (
                                            <Chip label="Disabled" color="default" size="small" />
                                        ) : (
                                            <Chip label="Available" size="small" variant="outlined" />
                                        )}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            {project.is_active_demo ? (
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="warning"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeactivate(project.uuid);
                                                    }}
                                                    disabled={activating === project.uuid}
                                                >
                                                    {activating === project.uuid ? (
                                                        <CircularProgress size={16} />
                                                    ) : (
                                                        'Deactivate'
                                                    )}
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleActivate(project.uuid);
                                                    }}
                                                    disabled={activating === project.uuid || !project.is_enabled}
                                                >
                                                    {activating === project.uuid ? (
                                                        <CircularProgress size={16} />
                                                    ) : (
                                                        'Select'
                                                    )}
                                                </Button>
                                            )}
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
}
