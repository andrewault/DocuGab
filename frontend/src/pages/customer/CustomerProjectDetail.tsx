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
    Tabs,
    Tab,
} from '@mui/material';
import { ArrowBack, Folder, Description as DocumentIcon, Add, Edit } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAuthHeader } from '../../utils/authUtils';
import { formatInUserTimezone } from '../../utils/timezoneUtils';
import CustomerBreadcrumbs from '../../components/CustomerBreadcrumbs';
import AvatarUpload from '../../components/AvatarUpload';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

interface Project {
    id: number;
    uuid: string;
    name: string;
    slug: string;
    description: string | null;
    subtitle: string | null;
    body: string | null;
    color_primary: string;
    color_secondary: string;
    color_background: string;
    return_link: string | null;
    return_link_text: string | null;
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
    const { uuid, tab } = useParams<{ uuid: string; tab?: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const currentTab = tab || 'properties';
    const [project, setProject] = useState<Project | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProject = useCallback(async () => {
        if (!uuid || !user) return;

        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/api/customer/projects/${uuid}`, {
                headers: getAuthHeader(),
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Chatbot Project not found');
                }
                throw new Error('Failed to fetch project');
            }

            const data = await response.json();

            // Verify this project belongs to the customer
            if (user?.customer_id && data.customer_id !== user.customer_id) {
                throw new Error('Access denied');
            }

            setProject(data);
            // setError(null); // Removed as per instruction

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
    }, [uuid, user]);

    useEffect(() => {
        if (user) {
            fetchProject();
        }
    }, [fetchProject, user]);

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
                    <Alert severity="error">{error || 'Chatbot Project not found'}</Alert>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        onClick={() => navigate(`/customer/${user?.customer_uuid}/projects`)}
                        sx={{ mt: 2 }}
                    >
                        Back to Chatbot Projects
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
                        { label: 'Chatbot Projects', path: `/customer/${user?.customer_uuid}/projects` },
                        { label: project.name },
                    ]}
                />

                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Folder sx={{ fontSize: 32, color: '#6366f1' }} />
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
                            {project.name} Chatbot Project
                        </Typography>
                    </Box>
                    <Button
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() => navigate(`/customer/${user?.customer_uuid}/projects/${project.uuid}/edit`)}
                    >
                        Edit
                    </Button>
                </Box>


                {/* Tabs */}
                <Paper
                    elevation={3}
                    sx={{
                        borderRadius: 2,
                        bgcolor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'background.paper',
                    }}
                >
                    <Tabs
                        value={currentTab}
                        onChange={(_, newValue) => {
                            navigate(`/customer/${user?.customer_uuid}/projects/${uuid}/${newValue}`);
                        }}
                        sx={{
                            borderBottom: 1,
                            borderColor: 'divider',
                            px: 2,
                        }}
                    >
                        <Tab label="Properties" value="properties" />
                        <Tab label="Avatar" value="avatar" />
                        <Tab label="Documents" value="documents" />
                    </Tabs>

                    {/* Properties Tab */}
                    {currentTab === 'properties' && (
                        <Box sx={{ p: 4 }}>
                            <Stack spacing={3}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                                        <Folder fontSize="small" />
                                        Chatbot Project Name
                                    </Typography>
                                    <Typography variant="h6" fontWeight={600}>
                                        {project.name}
                                    </Typography>
                                </Box>

                                <Divider />

                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Description
                                    </Typography>
                                    <Typography variant="body1">
                                        {project.description || 'No description provided'}
                                    </Typography>
                                </Box>

                                <Divider />

                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Slug
                                    </Typography>
                                    <Typography variant="body1" fontFamily="monospace">
                                        {project.slug}
                                    </Typography>
                                </Box>

                                <Divider />

                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Subtitle
                                    </Typography>
                                    <Typography variant="body1">
                                        {project.subtitle || 'No subtitle'}
                                    </Typography>
                                </Box>

                                <Divider />

                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Body
                                    </Typography>
                                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                        {project.body || 'No body content'}
                                    </Typography>
                                </Box>

                                <Divider />

                                <Stack direction="row" spacing={4}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Primary Color
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                            <Box
                                                sx={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: 1,
                                                    bgcolor: project.color_primary,
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                }}
                                            />
                                            <Typography variant="body2" fontFamily="monospace">
                                                {project.color_primary}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Secondary Color
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                            <Box
                                                sx={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: 1,
                                                    bgcolor: project.color_secondary,
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                }}
                                            />
                                            <Typography variant="body2" fontFamily="monospace">
                                                {project.color_secondary}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Background Color
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                            <Box
                                                sx={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: 1,
                                                    bgcolor: project.color_background,
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                }}
                                            />
                                            <Typography variant="body2" fontFamily="monospace">
                                                {project.color_background}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Stack>

                                <Divider />

                                <Stack direction="row" spacing={4}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Return Link
                                        </Typography>
                                        <Typography variant="body2">
                                            {project.return_link || 'Not set'}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Return Link Text
                                        </Typography>
                                        <Typography variant="body2">
                                            {project.return_link_text || 'Not set'}
                                        </Typography>
                                    </Box>
                                </Stack>

                                <Divider />

                                <Stack direction="row" spacing={4}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Status
                                        </Typography>
                                        <Box sx={{ mt: 0.5 }}>
                                            <Chip
                                                label={project.is_active ? 'Active' : 'Inactive'}
                                                color={project.is_active ? 'success' : 'default'}
                                                size="small"
                                            />
                                        </Box>
                                    </Box>

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
                                            Last Updated
                                        </Typography>
                                        <Typography variant="body2">
                                            {formatInUserTimezone(project.updated_at, user?.timezone || 'UTC')}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Stack>
                        </Box>
                    )}

                    {/* Avatar Tab */}
                    {currentTab === 'avatar' && (
                        <Box sx={{ p: 4 }}>
                            <AvatarUpload projectUuid={project.uuid} />
                        </Box>
                    )}

                    {/* Documents Tab */}
                    {currentTab === 'documents' && (
                        <Box sx={{ p: 4 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                                <Typography variant="h6" fontWeight={600}>
                                    Chatbot Project Documents
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<Add />}
                                    onClick={() =>
                                        navigate(
                                            `/customer/${user?.customer_uuid}/projects/${project.uuid}/documents/new`
                                        )
                                    }
                                >
                                    Upload Document
                                </Button>
                            </Stack>

                            {documents.length === 0 ? (
                                <Alert severity="info">No documents uploaded yet</Alert>
                            ) : (
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
                                                <TableCell>Uploaded</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {documents.map((doc) => (
                                                <TableRow key={doc.id} hover>
                                                    <TableCell>{doc.filename}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={doc.status}
                                                            color={
                                                                doc.status === 'processed'
                                                                    ? 'success'
                                                                    : doc.status === 'processing'
                                                                        ? 'warning'
                                                                        : doc.status === 'failed'
                                                                            ? 'error'
                                                                            : 'default'
                                                            }
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatInUserTimezone(doc.created_at, user?.timezone || 'UTC')}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Box>
                    )}
                </Paper>
            </Container>
        </Box>
    );
}

