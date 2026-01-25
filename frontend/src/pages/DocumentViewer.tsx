import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    Button,
    Chip,
    Stack,
    useTheme,
} from '@mui/material';
import { ArrowBack, Download } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';

interface DocumentData {
    id: number;
    uuid: string;
    filename: string;
    status: string;
    error_message?: string;
    file_size: number;
    content_type: string;
    created_at: string;
    updated_at?: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

export default function DocumentViewer() {
    const { uuid } = useParams<{ uuid: string }>();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [document, setDocument] = useState<DocumentData | null>(null);
    const [content, setContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDocument = async () => {
            if (!uuid) return;

            try {
                setLoading(true);
                setError(null);

                // Fetch document metadata
                const metaRes = await fetch(`${API_BASE}/api/documents/by-uuid/${uuid}`);
                if (!metaRes.ok) {
                    throw new Error('Document not found');
                }
                const docData = await metaRes.json();
                setDocument(docData);

                // For text-based documents, fetch content
                if (docData.content_type === 'text/plain' ||
                    docData.content_type === 'text/markdown' ||
                    docData.filename.endsWith('.md') ||
                    docData.filename.endsWith('.txt')) {
                    const contentRes = await fetch(`${API_BASE}/api/documents/by-uuid/${uuid}/content`);
                    if (contentRes.ok) {
                        const text = await contentRes.text();
                        setContent(text);
                    }
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load document');
            } finally {
                setLoading(false);
            }
        };

        fetchDocument();
    }, [uuid]);

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleDownload = () => {
        if (uuid) {
            window.open(`${API_BASE}/api/documents/by-uuid/${uuid}/content`, '_blank');
        }
    };

    const renderContent = () => {
        if (!document) return null;

        const isMarkdown = document.filename.endsWith('.md') || document.content_type === 'text/markdown';
        const isText = document.filename.endsWith('.txt') || document.content_type === 'text/plain';
        const isPdf = document.filename.endsWith('.pdf') || document.content_type === 'application/pdf';

        if (isPdf) {
            return (
                <Box sx={{ height: '100%' }}>
                    <iframe
                        src={`${API_BASE}/api/documents/by-uuid/${uuid}/content`}
                        style={{
                            width: '100%',
                            height: '100%',
                            border: 'none',
                            borderRadius: '8px',
                        }}
                        title={document.filename}
                    />
                </Box>
            );
        }

        if (isMarkdown && content) {
            return (
                <Paper
                    sx={{
                        p: 3,
                        bgcolor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'background.paper',
                        '& pre': {
                            bgcolor: isDark ? 'rgba(0,0,0,0.3)' : 'grey.100',
                            p: 2,
                            borderRadius: 1,
                            overflow: 'auto',
                        },
                        '& code': {
                            fontFamily: 'monospace',
                        },
                        '& h1, & h2, & h3': {
                            mt: 3,
                            mb: 1,
                        },
                    }}
                >
                    <ReactMarkdown>{content}</ReactMarkdown>
                </Paper>
            );
        }

        if (isText && content) {
            return (
                <Paper
                    sx={{
                        p: 3,
                        bgcolor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'background.paper',
                    }}
                >
                    <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'monospace' }}>
                        {content}
                    </pre>
                </Paper>
            );
        }

        // Fallback for unsupported types
        return (
            <Paper
                sx={{
                    p: 4,
                    textAlign: 'center',
                    bgcolor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'background.paper',
                }}
            >
                <Typography color="text.secondary" mb={2}>
                    Preview not available for this file type.
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Download />}
                    onClick={handleDownload}
                >
                    Download File
                </Button>
            </Paper>
        );
    };

    if (loading) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isDark
                        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
                        : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #f8fafc 100%)',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    py: 4,
                    background: isDark
                        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
                        : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #f8fafc 100%)',
                }}
            >
                <Container maxWidth="md">
                    <Button
                        startIcon={<ArrowBack />}
                        onClick={() => navigate('/documents')}
                        sx={{ mb: 3 }}
                    >
                        Back to Documents
                    </Button>
                    <Alert severity="error">{error}</Alert>
                </Container>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                pt: 1,
                pb: 2,
                background: isDark
                    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
                    : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #f8fafc 100%)',
            }}
        >
            <Box sx={{ display: 'flex', px: 3, gap: 3, height: 'calc(100vh - 100px)' }}>
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
                    }}
                >
                    <Button
                        startIcon={<ArrowBack />}
                        onClick={() => navigate('/documents')}
                        sx={{ justifyContent: 'flex-start' }}
                    >
                        Back to Documents
                    </Button>

                    <Box sx={{ my: 2 }}>
                        <Typography variant="h6" fontWeight={700} sx={{ wordBreak: 'break-word' }}>
                            {document?.filename}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {document && formatFileSize(document.file_size)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {document?.content_type}
                        </Typography>
                    </Box>

                    <Chip
                        label={document?.status}
                        color={document?.status === 'ready' ? 'success' : 'warning'}
                        size="small"
                        sx={{ alignSelf: 'flex-start' }}
                    />

                    <Box sx={{ flexGrow: 1 }} />

                    <Button
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={handleDownload}
                        fullWidth
                    >
                        Download
                    </Button>
                </Paper>

                {/* Document Content - takes remaining width */}
                <Box sx={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
                    {renderContent()}
                </Box>
            </Box>
        </Box>
    );
}
