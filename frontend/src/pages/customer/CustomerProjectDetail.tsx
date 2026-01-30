import { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Stack,
    Chip,
    CircularProgress,
    Alert,
    Button,
    Divider,
    useTheme,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import { ArrowBack, Folder, Description as DocumentIcon, Add } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
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
    customer_name: string;
    created_at: string;
    updated_at: string;
}

interface Document {
    id: number;
    uuid: string;
    filename: string;
    status: string;
    file_size: number;
    content_type: string;
    created_at: string;
    updated_at: string;
}

export default function CustomerProjectDetail() {
    const { uuid } = useParams<{ uuid: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [project, setProject] = useState<Project | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProject = useCallback(async () => {
        if (!uuid) return;

        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/api/customer/projects/${uuid}`, {
                headers: getAuthHeader(),
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Project not found');
                }
                throw new Error('Failed to fetch project');
            }

            const data = await response.json();

            // Verify this project belongs to the customer
            if (user?.customer_id && data.customer_id !== user.customer_id) {
                throw new Error('Access denied');
            }

            setProject(data);
            setError(null);

            // Fetch documents for this project
            const docsResponse = await fetch(
                `${API_BASE}/api/documents?project_id=${data.id}`,
                { headers: getAuthHeader() }
            );
            if (docsResponse.ok) {
                const docsData = await docsResponse.json();
                setDocuments(docsData.documents || []);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load project');
        } finally {
            setLoading(false);
        }
    }, [uuid, user?.customer_id]);

    useEffect(() => {
        fetchProject();
    }, [fetchProject]);

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

    if (error || !project) {
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
                    <Alert severity="error">{error || 'Project not found'}</Alert>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        onClick={() => navigate(`/customer/${user?.customer_uuid}/projects`)}
                        sx={{ mt: 2 }}
                    >
                        Back to Projects
                    </Button>
                </Container>
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
                <CustomerBreadcrumbs
                    items={[
                        { label: 'Projects', path: `/customer/${user?.customer_uuid}/projects` },
                        { label: project.name },
                    ]}
                />

                {/* Header */}
                <Box mb={4}>
                    <Typography
                        variant="h4"
                        component="h1"
                        sx={{
                            fontWeight: 700,
                            background: 'linear-gradient(90deg, #6366f1, #10b981)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        {project.name} Project
                    </Typography>
                </Box>

                {/* Project Details */}
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        borderRadius: 2,
                        bgcolor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'background.paper',
                    }}
                >
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                                <Folder fontSize="small" />
                                Project Name
                            </Typography>
                            <Typography variant="h6" fontWeight={600}>
                                {project.name}
                            </Typography>
                        </Box>

                        {project.description && (
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Description
                                </Typography>
                                <Typography variant="body1">
                                    {project.description}
                                </Typography>
                            </Box>
                        )}

                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                Status
                            </Typography>
                            <Box mt={1}>
                                <Chip
                                    label={project.is_active ? 'Active' : 'Inactive'}
                                    color={project.is_active ? 'success' : 'default'}
                                />
                            </Box>
                        </Box>

                        <Divider sx={{ my: 3 }} />

                        <Stack direction="row" spacing={4}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Created
                                </Typography>
                                <Typography variant="body2">
                                    {formatInUserTimezone(project.created_at, user?.timezone || 'UTC')}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Updated
                                </Typography>
                                <Typography variant="body2">
                                    {formatInUserTimezone(project.updated_at, user?.timezone || 'UTC')}
                                </Typography>
                            </Box>
                        </Stack>
                    </Stack>
                </Paper>

                {/* Documents Table */}
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        mt: 4,
                        borderRadius: 2,
                        bgcolor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'background.paper',
                    }}
                >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                        <Typography variant="h6" fontWeight={600}>
                            Project Documents
                        </Typography>
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<Add />}
                            onClick={() => navigate(`/customer/${user?.customer_uuid}/projects/${project.uuid}/documents/new`)}
                        >
                            Document
                        </Button>
                    </Stack>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <DocumentIcon fontSize="small" />
                                            Filename
                                        </Box>
                                    </TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Size</TableCell>
                                    <TableCell>Created</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {documents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                No documents found
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    documents.map((doc) => (
                                        <TableRow key={doc.uuid} hover>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {doc.filename}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={doc.status}
                                                    size="small"
                                                    color={
                                                        doc.status === 'completed'
                                                            ? 'success'
                                                            : doc.status === 'pending'
                                                                ? 'warning'
                                                                : 'error'
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {(doc.file_size / 1024).toFixed(1)} KB
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {formatInUserTimezone(doc.created_at, user?.timezone || 'UTC')}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Container>
        </Box>
    );
}
