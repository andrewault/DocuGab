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
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Folder,
    Business,
    CalendarToday,
    ArrowBack,
    Edit,
    Description,
    Palette,
    CloudUpload,
    VolumeUp,
    Delete,
    Forum,
} from '@mui/icons-material';
import { getAuthHeader } from '../../utils/authUtils';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';
import { StatusBanner } from '../../components/admin/StatusBanner';
import { InfoSection } from '../../components/admin/InfoSection';
import { DetailRow } from '../../components/admin/DetailRow';
import { getVoiceLabel, VOICE_TEST_TEXT } from '../../constants/voiceConstants';
import { useAuth } from '../../context/AuthContext';
import { formatInUserTimezone } from '../../utils/timezoneUtils';

interface Project {
    id: number;
    customer_id: number;
    customer_name: string;
    customer_uuid: string | null;
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
    is_demo: boolean;
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
    const { user: currentUser } = useAuth();
    const { uuid } = useParams<{ uuid: string }>();
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
    const [isDragging, setIsDragging] = useState(false);
    const [testingVoice, setTestingVoice] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
    const [deleting, setDeleting] = useState(false);


    const fetchDocuments = async () => {
        if (!project?.id) return;

        try {
            const docsResponse = await fetch(
                `${API_BASE}/api/documents?project_id=${project.id}`,
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
        if (!files || files.length === 0 || !project?.id) return;

        setUploading(true);
        setUploadError(null);

        try {
            for (const file of Array.from(files)) {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch(
                    `${API_BASE}/api/documents/upload?project_id=${project.id}`,
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

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            // Create a synthetic event to pass to handleFileUpload
            const input = document.getElementById('upload-file-input') as HTMLInputElement;
            if (input) {
                const dataTransfer = new DataTransfer();
                Array.from(files).forEach(file => dataTransfer.items.add(file));
                input.files = dataTransfer.files;

                const event = new Event('change', { bubbles: true });
                input.dispatchEvent(event);
            }
        }
    };

    const testVoice = async (voice: string) => {
        setTestingVoice(true);
        try {
            const res = await fetch(`${API_BASE}/api/speech/synthesize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: VOICE_TEST_TEXT, voice }),
            });

            if (res.ok) {
                const audioBlob = await res.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);

                audio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                };

                audio.play();
            }
        } catch (error) {
            console.error('Voice test error:', error);
        } finally {
            setTestingVoice(false);
        }
    };

    const handleDeleteClick = (doc: Document) => {
        setDocumentToDelete(doc);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!documentToDelete) return;

        setDeleting(true);
        try {
            const response = await fetch(`${API_BASE}/api/documents/${documentToDelete.id}`, {
                method: 'DELETE',
                headers: getAuthHeader(),
            });

            if (!response.ok) {
                throw new Error('Failed to delete document');
            }

            // Remove from list
            setDocuments(documents.filter(d => d.id !== documentToDelete.id));
            setDeleteDialogOpen(false);
            setDocumentToDelete(null);
        } catch (error) {
            console.error('Delete error:', error);
            // Optionally show error snackbar
        } finally {
            setDeleting(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch project details by UUID
                const projectResponse = await fetch(
                    `${API_BASE}/api/admin/projects/${uuid}`,
                    { headers: getAuthHeader() }
                );

                if (!projectResponse.ok) {
                    throw new Error('Failed to fetch project');
                }

                const projectData = await projectResponse.json();
                setProject(projectData);

                // Fetch documents for this project using integer ID
                const docsResponse = await fetch(
                    `${API_BASE}/api/documents?project_id=${projectData.id}`,
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

        if (uuid) {
            fetchData();
        }
    }, [uuid]);

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
            <Container maxWidth={false} sx={{ mt: 4, mb: 8, px: 3 }}>
                <StatusBanner
                    message="Demo Project • This is the chatbot demo that is linked from the home page."
                    visible={project.is_demo}
                />
                <AdminBreadcrumbs
                    items={[
                        { label: 'Customers', path: '/admin/customers' },
                        { label: project.customer_name, path: project.customer_uuid ? `/admin/customers/${project.customer_uuid}` : undefined },
                        { label: `${project.name} • Chatbot Project` },
                    ]}
                />

                {/* Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
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
                        {project.name} • Chatbot Project
                    </Typography>
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="outlined"
                            startIcon={<Forum />}
                            onClick={() => navigate(`/admin/projects/${uuid}/test`)}
                        >
                            Test Chat
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Edit />}
                            onClick={() => navigate(`/admin/projects/${uuid}/edit`)}
                        >
                            Edit Chatbot Project
                        </Button>
                    </Stack>
                </Stack>

                {/* Project Details */}
                <InfoSection title="Basic Info" icon={<Folder />}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
                        <Box sx={{ flex: 1 }}>
                            <Stack spacing={2}>
                                <DetailRow
                                    icon={<Folder fontSize="small" />}
                                    label="Chatbot Project Name"
                                    value={project.name}
                                    valueProps={{ fontWeight: 500 }}
                                />
                                <DetailRow
                                    icon={<Business fontSize="small" />}
                                    label="Customer"
                                    value={
                                        <Typography
                                            variant="body1"
                                            sx={{ cursor: 'pointer', color: 'primary.main' }}
                                            onClick={() => project.customer_uuid && navigate(`/admin/customers/${project.customer_uuid}`)}
                                        >
                                            {project.customer_name}
                                        </Typography>
                                    }
                                />
                                <DetailRow
                                    label="Slug"
                                    value={project.slug}
                                    valueProps={{ fontFamily: 'monospace' }}
                                />
                            </Stack>
                        </Box>

                        <Box sx={{ flex: 1 }}>
                            <Stack spacing={2}>
                                <DetailRow
                                    label="Status"
                                    value={
                                        <Box>
                                            <Chip
                                                label={project.is_active ? 'Active' : 'Inactive'}
                                                color={project.is_active ? 'success' : 'default'}
                                                size="small"
                                            />
                                            {project.is_demo && (
                                                <Chip
                                                    label="Demo Project"
                                                    color="secondary"
                                                    size="small"
                                                    variant="filled"
                                                    sx={{ ml: 1 }}
                                                />
                                            )}
                                        </Box>
                                    }
                                />
                                <DetailRow
                                    icon={<CalendarToday fontSize="small" />}
                                    label="Created"
                                    value={formatInUserTimezone(
                                        project.created_at,
                                        currentUser?.timezone || 'America/Los_Angeles',
                                        'PP'
                                    )}
                                />
                                <DetailRow
                                    icon={<Description fontSize="small" />}
                                    label="Documents"
                                    value={project.documents_count}
                                    valueProps={{ fontWeight: 500 }}
                                />
                            </Stack>
                        </Box>
                    </Stack>
                </InfoSection>

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
                                        Chatbot Project Name
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

                                {project.logo && (
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
                                )}

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

                {/* Avatar and Voice */}
                <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        Avatar and Voice
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
                        <Box sx={{ flex: 1 }}>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Avatar
                                    </Typography>
                                    <Typography variant="body1" fontFamily="monospace">
                                        {project.avatar || 'Default (avatar.glb)'}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                        Voice Assistant
                                    </Typography>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Typography variant="body1">
                                            {getVoiceLabel(project.voice)}
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<VolumeUp />}
                                            onClick={() => testVoice(project.voice)}
                                            disabled={testingVoice}
                                        >
                                            Test
                                        </Button>
                                    </Stack>
                                </Box>
                            </Stack>
                        </Box>
                    </Stack>
                </Paper>

                {/* Documents */}
                <Paper elevation={2} sx={{ p: 3, mb: 10 }}>
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
                                        <TableCell align="right">Actions</TableCell>
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
                                                {formatInUserTimezone(
                                                    doc.created_at,
                                                    currentUser?.timezone || 'America/Los_Angeles',
                                                    'PPpp'
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="Delete Document">
                                                    <IconButton
                                                        edge="end"
                                                        aria-label="delete"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteClick(doc);
                                                        }}
                                                        color="error"
                                                        size="small"
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                </Tooltip>
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
                        <Box
                            sx={{
                                mt: 2,
                                p: 4,
                                border: '2px dashed',
                                borderColor: isDragging ? 'primary.main' : 'divider',
                                borderRadius: 2,
                                bgcolor: isDragging ? 'action.hover' : 'background.paper',
                                transition: 'all 0.2s',
                                cursor: uploading ? 'default' : 'pointer',
                                '&:hover': uploading ? {} : {
                                    borderColor: 'primary.main',
                                    bgcolor: 'action.hover',
                                },
                            }}
                            onDragEnter={handleDragEnter}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <input
                                accept=".pdf,.txt,.md,.docx"
                                style={{ display: 'none' }}
                                id="upload-file-input"
                                type="file"
                                multiple
                                onChange={handleFileUpload}
                                disabled={uploading}
                            />
                            <label htmlFor="upload-file-input" style={{ cursor: uploading ? 'default' : 'pointer', display: 'block' }}>
                                <Stack spacing={2} alignItems="center">
                                    <CloudUpload sx={{ fontSize: 48, color: isDragging ? 'primary.main' : 'text.secondary' }} />
                                    <Typography variant="h6" align="center">
                                        {uploading ? 'Uploading...' : isDragging ? 'Drop files here' : 'Drag and drop files here'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" align="center">
                                        or
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        component="span"
                                        startIcon={<CloudUpload />}
                                        disabled={uploading}
                                    >
                                        Choose Files
                                    </Button>
                                    <Typography variant="caption" color="text.secondary" align="center">
                                        Supported formats: PDF, TXT, MD, DOCX
                                    </Typography>
                                </Stack>
                            </label>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteDialogOpen} onClose={() => !deleting && setDeleteDialogOpen(false)}>
                    <DialogTitle>Delete Document?</DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to delete <strong>{documentToDelete?.original_filename}</strong>?
                        </Typography>
                        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                            This will permanently delete the file and all associated search chunks.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button onClick={confirmDelete} color="error" variant="contained" disabled={deleting}>
                            {deleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container >
        </Box >
    );
}
