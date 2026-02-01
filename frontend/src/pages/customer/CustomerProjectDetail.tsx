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
    TableSortLabel,
    Tabs,
    Tab,
} from '@mui/material';
import { ArrowBack, RecordVoiceOver, Description as DocumentIcon, Add, Edit, Forum } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAuthHeader } from '../../utils/authUtils';
import { formatInUserTimezone } from '../../utils/timezoneUtils';
import CustomerBreadcrumbs from '../../components/CustomerBreadcrumbs';
import AvatarUpload from '../../components/AvatarUpload';
import InactiveCustomerBanner from '../../components/InactiveCustomerBanner';
import { getVoiceLabel } from '../../constants/voiceConstants';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

interface Project {
    id: number;
    uuid: string;
    name: string;
    slug: string;
    description: string | null;
    title: string;
    subtitle: string | null;
    body: string | null;
    logo: string | null;
    color_primary: string;
    color_secondary: string;
    color_background: string;
    voice: string;
    return_link: string | null;
    return_link_text: string | null;
    is_active: boolean;
    is_enabled: boolean;
    is_ready: boolean;
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
    const [orderBy, setOrderBy] = useState<keyof Document>('filename');
    const [order, setOrder] = useState<'asc' | 'desc'>('asc');

    const fetchProject = useCallback(async () => {
        if (!uuid || !user) return;

        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/api/v1/customer/projects/${uuid}`, {
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
                `${API_BASE}/api/v1/documents?project_id=${data.id}`,
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
                        onClick={() => navigate(`/customer`)}
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
                <InactiveCustomerBanner />
                {/* Breadcrumbs */}
                <CustomerBreadcrumbs
                    items={[
                        { label: 'Chatbot Projects', path: `/customer/projects` },
                        { label: project.name },
                    ]}
                />

                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                            {project.name} Chatbot Project
                        </Typography>
                        {project.is_ready ? (
                            <Chip
                                label="Ready"
                                sx={{
                                    backgroundColor: '#4caf50',
                                    color: 'white',
                                    fontWeight: 600,
                                }}
                            />
                        ) : (
                            <Chip
                                label="Not Ready"
                                sx={{
                                    backgroundColor: '#f44336',
                                    color: 'white',
                                    fontWeight: 600,
                                }}
                            />
                        )}
                    </Box>
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="outlined"
                            startIcon={<Forum />}
                            onClick={() => navigate(`/customer/projects/${project.uuid}/test`)}
                        >
                            Test Chat
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<Edit />}
                            onClick={() => navigate(`/customer/projects/${project.uuid}/edit`)}
                        >
                            Edit
                        </Button>
                    </Stack>
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
                            navigate(
                                `/customer/projects/${uuid}/${newValue}`,
                                { replace: true }
                            );
                        }}
                        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
                    >
                        <Tab label="Basic Info" value="properties" />
                        <Tab label="Branding" value="branding" />
                        <Tab label="Avatar" value="avatar" />
                        <Tab label="Documents" value="documents" />
                    </Tabs>

                    {/* Properties Tab */}
                    {currentTab === 'properties' && (
                        <Box sx={{ p: 4 }}>
                            <Stack spacing={3}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                                        <RecordVoiceOver fontSize="small" />
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

                                {project.slug && (
                                    <>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Slug
                                            </Typography>
                                            <Typography variant="body1" fontFamily="monospace">
                                                {project.slug}
                                            </Typography>
                                        </Box>

                                        <Divider />
                                    </>
                                )}

                                {project.voice && (
                                    <>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Voice Assistant
                                            </Typography>
                                            <Typography variant="body1">
                                                {getVoiceLabel(project.voice)}
                                            </Typography>
                                        </Box>

                                        <Divider />
                                    </>
                                )}

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


                    {/* Branding Tab */}
                    {currentTab === 'branding' && (
                        <Box sx={{ p: 4 }}>
                            <Stack spacing={3}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Title
                                    </Typography>
                                    <Typography variant="body1" fontWeight={500}>
                                        {project.title}
                                    </Typography>
                                </Box>

                                <Divider />

                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Subtitle
                                    </Typography>
                                    <Typography variant="body1">
                                        {project.subtitle || '—'}
                                    </Typography>
                                </Box>

                                <Divider />

                                {project.body && (
                                    <>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Body Text
                                            </Typography>
                                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                                {project.body}
                                            </Typography>
                                        </Box>

                                        <Divider />
                                    </>
                                )}

                                {project.logo && (
                                    <>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Logo
                                            </Typography>
                                            <Box sx={{ mt: 1 }}>
                                                <img
                                                    src={`${API_BASE}${project.logo}`}
                                                    alt="Project Logo"
                                                    style={{
                                                        maxWidth: '200px',
                                                        maxHeight: '100px',
                                                        objectFit: 'contain',
                                                    }}
                                                />
                                            </Box>
                                        </Box>

                                        <Divider />
                                    </>
                                )}

                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                        Colors
                                    </Typography>
                                    <Stack direction="row" spacing={2}>
                                        <Box>
                                            <Box
                                                sx={{
                                                    width: 60,
                                                    height: 60,
                                                    borderRadius: 1,
                                                    bgcolor: project.color_primary,
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    mb: 0.5,
                                                }}
                                            />
                                            <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                                                Primary
                                            </Typography>
                                            <Typography variant="caption" fontFamily="monospace" display="block" textAlign="center">
                                                {project.color_primary}
                                            </Typography>
                                        </Box>

                                        <Box>
                                            <Box
                                                sx={{
                                                    width: 60,
                                                    height: 60,
                                                    borderRadius: 1,
                                                    bgcolor: project.color_secondary,
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    mb: 0.5,
                                                }}
                                            />
                                            <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                                                Secondary
                                            </Typography>
                                            <Typography variant="caption" fontFamily="monospace" display="block" textAlign="center">
                                                {project.color_secondary}
                                            </Typography>
                                        </Box>

                                        <Box>
                                            <Box
                                                sx={{
                                                    width: 60,
                                                    height: 60,
                                                    borderRadius: 1,
                                                    bgcolor: project.color_background,
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    mb: 0.5,
                                                }}
                                            />
                                            <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                                                Background
                                            </Typography>
                                            <Typography variant="caption" fontFamily="monospace" display="block" textAlign="center">
                                                {project.color_background}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Box>

                                {(project.return_link || project.return_link_text) && (
                                    <>
                                        <Divider />

                                        <Stack direction="row" spacing={4}>
                                            {project.return_link && (
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Return Link
                                                    </Typography>
                                                    <Typography variant="body1" fontFamily="monospace">
                                                        {project.return_link}
                                                    </Typography>
                                                </Box>
                                            )}

                                            {project.return_link_text && (
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Return Link Text
                                                    </Typography>
                                                    <Typography variant="body1">
                                                        {project.return_link_text}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Stack>
                                    </>
                                )}
                            </Stack>
                        </Box>
                    )
                    }


                    {/* Avatar Tab */}
                    {
                        currentTab === 'avatar' && (
                            <Box sx={{ p: 4 }}>
                                <AvatarUpload projectUuid={project.uuid} />
                            </Box>
                        )
                    }

                    {/* Documents Tab */}
                    {
                        currentTab === 'documents' && (
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
                                                `/customer/projects/${project.uuid}/documents/new`
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
                                                        <TableSortLabel
                                                            active={orderBy === 'filename'}
                                                            direction={orderBy === 'filename' ? order : 'asc'}
                                                            onClick={() => {
                                                                const isAsc = orderBy === 'filename' && order === 'asc';
                                                                setOrder(isAsc ? 'desc' : 'asc');
                                                                setOrderBy('filename');
                                                            }}
                                                        >
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <DocumentIcon fontSize="small" />
                                                                Filename
                                                            </Box>
                                                        </TableSortLabel>
                                                    </TableCell>
                                                    <TableCell>Status</TableCell>
                                                    <TableCell>
                                                        <TableSortLabel
                                                            active={orderBy === 'file_size'}
                                                            direction={orderBy === 'file_size' ? order : 'asc'}
                                                            onClick={() => {
                                                                const isAsc = orderBy === 'file_size' && order === 'asc';
                                                                setOrder(isAsc ? 'desc' : 'asc');
                                                                setOrderBy('file_size');
                                                            }}
                                                        >
                                                            Size
                                                        </TableSortLabel>
                                                    </TableCell>
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
                                                            Uploaded
                                                        </TableSortLabel>
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {[...documents]
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
                                                    .map((doc) => (
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
                        )
                    }
                </Paper >
            </Container >
        </Box >
    );
}

