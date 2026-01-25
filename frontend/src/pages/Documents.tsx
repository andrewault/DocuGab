import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
    IconButton,
    Chip,
    Button,
    CircularProgress,
    Alert,
    useTheme,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stack,
} from '@mui/material';
import { Delete, Refresh, CloudUpload, Close, Description } from '@mui/icons-material';
import DocumentUpload from '../components/DocumentUpload';

interface Document {
    id: number;
    uuid: string;
    filename: string;
    status: 'pending' | 'processing' | 'ready' | 'error';
    error_message?: string | null;
    file_size: number;
    content_type?: string;
    created_at: string;
    updated_at?: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';
const POLL_INTERVAL = 3000; // Poll every 3 seconds when documents are processing

export default function Documents() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showUpload, setShowUpload] = useState(false);
    const [deleting, setDeleting] = useState<number | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const navigate = useNavigate();
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchDocuments = useCallback(async (silent = false) => {
        try {
            if (!silent) {
                setLoading(true);
                setError(null);
            }
            const response = await fetch(`${API_BASE}/api/documents/`);
            if (!response.ok) throw new Error('Failed to fetch documents');
            const data = await response.json();
            // Handle both array and object with documents key
            setDocuments(Array.isArray(data) ? data : data.documents || []);
        } catch (err) {
            if (!silent) {
                setError(err instanceof Error ? err.message : 'Failed to load documents');
            }
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    }, []);

    const fetchDocumentDetail = async (id: number) => {
        try {
            const response = await fetch(`${API_BASE}/api/documents/${id}`);
            if (!response.ok) throw new Error('Failed to fetch document details');
            const data = await response.json();
            setSelectedDoc(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load document details');
        }
    };

    const handleDelete = async (id: number) => {
        setDeleteConfirmId(null); // Close modal

        try {
            setDeleting(id);
            const response = await fetch(`${API_BASE}/api/documents/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete document');
            setDocuments(docs => docs.filter(d => d.id !== id));
            if (selectedDoc?.id === id) setSelectedDoc(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete document');
        } finally {
            setDeleting(null);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ready': return 'success';
            case 'processing': return 'warning';
            case 'pending': return 'info';
            case 'error': return 'error';
            default: return 'default';
        }
    };

    // Scroll to top on mount
    useLayoutEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    // Auto-poll when there are processing documents
    useEffect(() => {
        const hasProcessingDocs = documents.some(
            doc => doc.status === 'pending' || doc.status === 'processing'
        );

        if (hasProcessingDocs) {
            // Start polling
            pollIntervalRef.current = setInterval(() => {
                fetchDocuments(true); // Silent refresh
            }, POLL_INTERVAL);
        } else {
            // Stop polling
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        }

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, [documents, fetchDocuments]);

    return (
        <Box
            sx={{
                height: 'calc(100vh - 64px)',
                overflow: 'hidden',
                background: isDark
                    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
                    : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #f8fafc 100%)',
                pt: 1,
                pb: 1,
            }}
        >
            <Box sx={{ display: 'flex', px: 3, gap: 3, height: 'calc(100% - 76px)' }}>
                {/* Left Sidebar */}
                <Paper
                    sx={{
                        width: 280,
                        flexShrink: 0,
                        p: 3,
                        bgcolor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'background.paper',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        borderRadius: 2,
                        overflow: 'auto',
                    }}
                >
                    {/* Title */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Description sx={{ fontSize: 28, color: '#6366f1' }} />
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 700,
                                background: 'linear-gradient(90deg, #6366f1, #10b981)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            Documents
                        </Typography>
                    </Box>

                    {/* Actions */}
                    <Button
                        variant="contained"
                        startIcon={<CloudUpload />}
                        onClick={() => setShowUpload(!showUpload)}
                        fullWidth
                        sx={{
                            background: 'linear-gradient(90deg, #6366f1, #4f46e5)',
                            '&:hover': {
                                background: 'linear-gradient(90deg, #4f46e5, #4338ca)',
                            },
                        }}
                    >
                        Upload
                    </Button>

                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={() => fetchDocuments()}
                        disabled={loading}
                        fullWidth
                    >
                        Refresh
                    </Button>

                    {/* Upload Section */}
                    {showUpload && (
                        <Box sx={{ mt: 2 }}>
                            <DocumentUpload onUploadComplete={() => {
                                fetchDocuments();
                                setShowUpload(false);
                            }} />
                        </Box>
                    )}

                    <Box sx={{ flexGrow: 1 }} />

                    {/* Document count */}
                    {!loading && documents.length > 0 && (
                        <Typography variant="body2" color="text.secondary">
                            {documents.length} document{documents.length !== 1 ? 's' : ''}
                        </Typography>
                    )}
                </Paper>

                {/* Main Content Area */}
                <Box sx={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
                    {/* Error Alert */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    {/* Documents Table */}
                    <TableContainer component={Paper} sx={{ bgcolor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'background.paper', height: '100%' }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Filename</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Size</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Uploaded</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                            <CircularProgress />
                                        </TableCell>
                                    </TableRow>
                                ) : documents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                            <Typography color="text.secondary">
                                                No documents uploaded yet
                                            </Typography>
                                            <Button
                                                variant="text"
                                                startIcon={<CloudUpload />}
                                                onClick={() => setShowUpload(true)}
                                                sx={{ mt: 2 }}
                                            >
                                                Upload your first document
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    documents.map((doc) => (
                                        <TableRow
                                            key={doc.id}
                                            hover
                                            onClick={() => navigate(`/documents/${doc.uuid}`)}
                                            sx={{ cursor: 'pointer' }}
                                        >
                                            <TableCell>{doc.filename}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={doc.status}
                                                    color={getStatusColor(doc.status) as any}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                                            <TableCell>{formatDate(doc.created_at)}</TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteConfirmId(doc.id);
                                                    }}
                                                    disabled={deleting === doc.id}
                                                    color="error"
                                                    size="small"
                                                >
                                                    {deleting === doc.id ? (
                                                        <CircularProgress size={20} />
                                                    ) : (
                                                        <Delete />
                                                    )}
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </Box>

            {/* Document Detail Dialog */}
            <Dialog
                open={!!selectedDoc}
                onClose={() => setSelectedDoc(null)}
                maxWidth="sm"
                fullWidth
            >
                {selectedDoc && (
                    <>
                        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" component="span" noWrap sx={{ flex: 1, mr: 2 }}>
                                {selectedDoc.filename}
                            </Typography>
                            <IconButton onClick={() => setSelectedDoc(null)} size="small">
                                <Close />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent dividers>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Status</Typography>
                                    <Box>
                                        <Chip
                                            label={selectedDoc.status}
                                            color={getStatusColor(selectedDoc.status) as any}
                                            size="small"
                                        />
                                    </Box>
                                </Box>

                                {selectedDoc.error_message && (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Error</Typography>
                                        <Alert severity="error" sx={{ mt: 0.5 }}>
                                            {selectedDoc.error_message}
                                        </Alert>
                                    </Box>
                                )}

                                <Box>
                                    <Typography variant="caption" color="text.secondary">File Size</Typography>
                                    <Typography>{formatFileSize(selectedDoc.file_size)}</Typography>
                                </Box>

                                {selectedDoc.content_type && (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Content Type</Typography>
                                        <Typography>{selectedDoc.content_type}</Typography>
                                    </Box>
                                )}

                                <Box>
                                    <Typography variant="caption" color="text.secondary">Uploaded</Typography>
                                    <Typography>{formatDate(selectedDoc.created_at)}</Typography>
                                </Box>

                                {selectedDoc.updated_at && (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Last Updated</Typography>
                                        <Typography>{formatDate(selectedDoc.updated_at)}</Typography>
                                    </Box>
                                )}
                            </Stack>
                        </DialogContent>
                        <DialogActions>
                            <Button
                                color="error"
                                onClick={() => handleDelete(selectedDoc.id)}
                                disabled={deleting === selectedDoc.id}
                            >
                                Delete
                            </Button>
                            <Button onClick={() => setSelectedDoc(null)}>Close</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog
                open={deleteConfirmId !== null}
                onClose={() => setDeleteConfirmId(null)}
            >
                <DialogTitle>Delete Document</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this document? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmId(null)}>
                        Cancel
                    </Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
