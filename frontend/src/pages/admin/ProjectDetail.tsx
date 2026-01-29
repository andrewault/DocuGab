import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Paper,
    Chip,
    CircularProgress,
    Alert,
    Button,
    Stack,
    Divider,
    useTheme,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    Folder,
    Business,
    Public,
    CalendarToday,
    ArrowBack,
    Edit,
    Description,
    Palette,
    CloudUpload,
} from '@mui/icons-material';
import { getAuthHeader } from '../../utils/authUtils';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';

interface Project {
    id: number;
    customer_id: number;
    customer_name: string;
    name: string;
    slug: string;
    description: string | null;
    subdomain: string;
    logo: string | null;
    title: string;
    subtitle: string | null;
    body: string | null;
    color_primary: string;
    color_secondary: string;
    color_background: string;
    avatar: string;
    voice: string;
    return_link: string | null;
    return_link_text: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    documents_count: number;
}

interface Document {
    id: number;
    uuid: string;
    project_id: number;
    filename: string;
    original_filename: string;
    file_size: number;
    content_type: string;
    status: string;
    chunks_count: number;
    created_at: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

export default function ProjectDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [project, setProject] = useState<Project | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const fetchDocuments = async () => {
        if (!id) return;

        try {
            const docsResponse = await fetch(
                `${API_BASE}/api/documents?project_id=${id}`,
                { headers: getAuthHeader() }
            );

            if (docsResponse.ok) {
                const docsData = await docsResponse.json();
                setDocuments(docsData.documents || []);
            }
        } catch (err) {
            console.error('Failed to fetch documents:', err);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0 || !id) return;

        setUploading(true);
        setUploadError(null);

        try {
            for (const file of Array.from(files)) {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch(
                    `${API_BASE}/api/documents/upload?project_id=${id}`,
                    {
                        method: 'POST',
                        headers: getAuthHeader(),
                        body: formData,
                    }
                );

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || 'Upload failed');
                }
            }

            // Refresh documents list
            await fetchDocuments();
            setUploadDialogOpen(false);
        } catch (err) {
            setUploadError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch project details
                const projectResponse = await fetch(
                    `${API_BASE}/api/admin/projects/${id}`,
                    { headers: getAuthHeader() }
                );

                if (!projectResponse.ok) {
                    throw new Error('Failed to fetch project');
                }

                const projectData = await projectResponse.json();
                setProject(projectData);

                // Fetch documents for this project
                const docsResponse = await fetch(
                    `${API_BASE}/api/documents?project_id=${id}`,
                    { headers: getAuthHeader() }
                );

                if (docsResponse.ok) {
                    const docsData = await docsResponse.json();
                    setDocuments(docsData.documents || []);
                }

                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id]);

    if (loading) {
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
                    <Box display="flex" justifyContent="center" py={8}>
                        <CircularProgress />
                    </Box>
                </Container>
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
                        startIcon={<ArrowBack />}
                        onClick={() => navigate('/admin/projects')}
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
                <AdminBreadcrumbs
                    items={[
                        { label: 'Customers', path: '/admin/customers' },
                        { label: project.customer_name, path: `/admin/customers/${project.customer_id}` },
                        { label: project.name },
                    ]}
                />

                {/* Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                    <Typography variant="h4" component="h1">
                        <Folder sx={{ mr: 1, verticalAlign: 'bottom' }} />
                        {project.name}
                    </Typography>
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="outlined"
                            startIcon={<ArrowBack />}
                            onClick={() => navigate('/admin/projects')}
                        >
                            Back
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Edit />}
                            onClick={() => {
                                alert('Edit functionality coming soon!');
                            }}
                        >
                            Edit Project
                        </Button>
                    </Stack>
                </Stack>

                {/* Project Details */}
                <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        Project Details
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
                        <Box sx={{ flex: 1 }}>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                                        <Folder fontSize="small" />
                                        Project Name
                                    </Typography>
                                    <Typography variant="body1" fontWeight={500}>
                                        {project.name}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                                        <Business fontSize="small" />
                                        Customer
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        sx={{ cursor: 'pointer', color: 'primary.main' }}
                                        onClick={() => navigate(`/admin/customers/${project.customer_id}`)}
                                    >
                                        {project.customer_name}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                                        <Public fontSize="small" />
                                        Subdomain
                                    </Typography>
                                    <Typography variant="body1" fontFamily="monospace">
                                        {project.subdomain}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Slug
                                    </Typography>
                                    <Typography variant="body1" fontFamily="monospace">
                                        {project.slug}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>

                        <Box sx={{ flex: 1 }}>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Status
                                    </Typography>
                                    <Box>
                                        <Chip
                                            label={project.is_active ? 'Active' : 'Inactive'}
                                            color={project.is_active ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </Box>
                                </Box>

                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                                        <CalendarToday fontSize="small" />
                                        Created
                                    </Typography>
                                    <Typography variant="body1">
                                        {new Date(project.created_at).toLocaleDateString()}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                                        <Description fontSize="small" />
                                        Documents
                                    </Typography>
                                    <Typography variant="body1" fontWeight={500}>
                                        {project.documents_count}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>
                    </Stack>

                    {project.description && (
                        <>
                            <Divider sx={{ my: 3 }} />
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Description
                                </Typography>
                                <Typography variant="body1" sx={{ mt: 1 }}>
                                    {project.description}
                                </Typography>
                            </Box>
                        </>
                    )}
                </Paper>

                {/* Branding Details */}
                <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        <Palette sx={{ mr: 1, verticalAlign: 'bottom' }} />
                        Branding
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
                        <Box sx={{ flex: 1 }}>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Page Title
                                    </Typography>
                                    <Typography variant="body1" fontWeight={500}>
                                        {project.title}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Subtitle
                                    </Typography>
                                    <Typography variant="body1">
                                        {project.subtitle || '—'}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Avatar
                                    </Typography>
                                    <Typography variant="body1" fontFamily="monospace">
                                        {project.avatar}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Voice
                                    </Typography>
                                    <Typography variant="body1" fontFamily="monospace">
                                        {project.voice}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>

                        <Box sx={{ flex: 1 }}>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Colors
                                    </Typography>
                                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                        <Box
                                            sx={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 1,
                                                bgcolor: project.color_primary,
                                                border: '1px solid',
                                                borderColor: 'divider',
                                            }}
                                            title={`Primary: ${project.color_primary}`}
                                        />
                                        <Box
                                            sx={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 1,
                                                bgcolor: project.color_secondary,
                                                border: '1px solid',
                                                borderColor: 'divider',
                                            }}
                                            title={`Secondary: ${project.color_secondary}`}
                                        />
                                        <Box
                                            sx={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 1,
                                                bgcolor: project.color_background,
                                                border: '1px solid',
                                                borderColor: 'divider',
                                            }}
                                            title={`Background: ${project.color_background}`}
                                        />
                                    </Stack>
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                        Primary • Secondary • Background
                                    </Typography>
                                </Box>

                                {project.return_link && (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Return Link
                                        </Typography>
                                        <Typography variant="body1">
                                            {project.return_link_text || 'Back'} → {project.return_link}
                                        </Typography>
                                    </Box>
                                )}
                            </Stack>
                        </Box>
                    </Stack>

                    {project.body && (
                        <>
                            <Divider sx={{ my: 3 }} />
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Body Content
                                </Typography>
                                <Typography variant="body1" sx={{ mt: 1 }}>
                                    {project.body}
                                </Typography>
                            </Box>
                        </>
                    )}
                </Paper>

                {/* Documents */}
                <Paper elevation={2} sx={{ p: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">
                            <Description sx={{ mr: 1, verticalAlign: 'bottom' }} />
                            Documents ({documents.length})
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<CloudUpload />}
                            onClick={() => setUploadDialogOpen(true)}
                        >
                            Upload Document
                        </Button>
                    </Stack>
                    <Divider sx={{ mb: 3 }} />

                    {documents.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                            No documents uploaded yet
                        </Typography>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Filename</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell>Size</TableCell>
                                        <TableCell>Chunks</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Uploaded</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {documents.map((doc) => (
                                        <TableRow key={doc.id} hover>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {doc.original_filename}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                                                    {doc.uuid}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={doc.content_type}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {(doc.file_size / 1024).toFixed(1)} KB
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={doc.chunks_count}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={doc.status}
                                                    size="small"
                                                    color={doc.status === 'processed' ? 'success' : doc.status === 'processing' ? 'info' : 'default'}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {new Date(doc.created_at).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>

                {/* Upload Dialog */}
                <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Upload Document</DialogTitle>
                    <DialogContent>
                        {uploadError && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {uploadError}
                            </Alert>
                        )}
                        <Box sx={{ mt: 2 }}>
                            <input
                                accept=".pdf,.txt,.md,.doc,.docx"
                                style={{ display: 'none' }}
                                id="upload-file-input"
                                type="file"
                                multiple
                                onChange={handleFileUpload}
                                disabled={uploading}
                            />
                            <label htmlFor="upload-file-input">
                                <Button
                                    variant="outlined"
                                    component="span"
                                    fullWidth
                                    startIcon={<CloudUpload />}
                                    disabled={uploading}
                                    sx={{ py: 2 }}
                                >
                                    {uploading ? 'Uploading...' : 'Choose Files'}
                                </Button>
                            </label>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Supported formats: PDF, TXT, MD, DOC, DOCX
                            </Typography>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
}
