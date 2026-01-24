import { useState, useEffect } from 'react';
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
} from '@mui/material';
import { Delete, Refresh, CloudUpload } from '@mui/icons-material';
import DocumentUpload from '../components/DocumentUpload';

interface Document {
    id: number;
    filename: string;
    status: 'pending' | 'processing' | 'ready' | 'error';
    file_size: number;
    content_type: string;
    created_at: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

export default function Documents() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showUpload, setShowUpload] = useState(false);
    const [deleting, setDeleting] = useState<number | null>(null);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`${API_BASE}/api/documents/`);
            if (!response.ok) throw new Error('Failed to fetch documents');
            const data = await response.json();
            // Handle both array and object with documents key
            setDocuments(Array.isArray(data) ? data : data.documents || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this document?')) return;

        try {
            setDeleting(id);
            const response = await fetch(`${API_BASE}/api/documents/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete document');
            setDocuments(docs => docs.filter(d => d.id !== id));
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

    useEffect(() => {
        fetchDocuments();
    }, []);

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
                py: 4,
            }}
        >
            <Container maxWidth="lg">
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
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
                        Documents
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="outlined"
                            startIcon={<Refresh />}
                            onClick={fetchDocuments}
                            disabled={loading}
                        >
                            Refresh
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<CloudUpload />}
                            onClick={() => setShowUpload(!showUpload)}
                            sx={{
                                background: 'linear-gradient(90deg, #6366f1, #4f46e5)',
                                '&:hover': {
                                    background: 'linear-gradient(90deg, #4f46e5, #4338ca)',
                                },
                            }}
                        >
                            Upload
                        </Button>
                    </Box>
                </Box>

                {/* Upload Section */}
                {showUpload && (
                    <Box sx={{ mb: 4 }}>
                        <DocumentUpload onUploadComplete={() => {
                            fetchDocuments();
                            setShowUpload(false);
                        }} />
                    </Box>
                )}

                {/* Error Alert */}
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {/* Documents Table */}
                <TableContainer component={Paper} sx={{ bgcolor: 'rgba(30, 41, 59, 0.8)' }}>
                    <Table>
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
                                    <TableRow key={doc.id} hover>
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
                                                onClick={() => handleDelete(doc.id)}
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

                {/* Document count */}
                {!loading && documents.length > 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'right' }}>
                        {documents.length} document{documents.length !== 1 ? 's' : ''}
                    </Typography>
                )}
            </Container>
        </Box>
    );
}
