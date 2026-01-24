import { useState, useCallback } from 'react';
import {
    Box, Paper, Typography, LinearProgress,
    List, ListItem, ListItemText, Chip
} from '@mui/material';
import { CloudUpload, CheckCircle, Error, HourglassEmpty } from '@mui/icons-material';

interface UploadedDoc {
    id: number;
    filename: string;
    status: 'pending' | 'processing' | 'ready' | 'error';
}

interface DocumentUploadProps {
    onUploadComplete?: () => void;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

export default function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [documents, setDocuments] = useState<UploadedDoc[]>([]);
    const [dragOver, setDragOver] = useState(false);

    const uploadFile = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${API_BASE}/api/documents/upload`, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.detail || 'Upload failed');
            }

            const data = await res.json();
            setDocuments(prev => [...prev, {
                id: data.id,
                filename: file.name,
                status: data.status
            }]);

            // Start polling for status
            pollStatus(data.id);

            onUploadComplete?.();
        } catch (error) {
            console.error('Upload error:', error);
            setDocuments(prev => [...prev, {
                id: Date.now(),
                filename: file.name,
                status: 'error'
            }]);
        }
    };

    const pollStatus = async (docId: number) => {
        const checkStatus = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/documents/${docId}`);
                if (res.ok) {
                    const data = await res.json();
                    setDocuments(prev =>
                        prev.map(d => d.id === docId ? { ...d, status: data.status } : d)
                    );

                    if (data.status === 'pending' || data.status === 'processing') {
                        setTimeout(checkStatus, 2000);
                    }
                }
            } catch (e) {
                console.error('Status check failed:', e);
            }
        };

        setTimeout(checkStatus, 1000);
    };

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        setUploading(true);

        for (const file of files) {
            await uploadFile(file);
        }

        setUploading(false);
    }, []);

    const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        setUploading(true);
        for (const file of Array.from(files)) {
            await uploadFile(file);
        }
        setUploading(false);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'ready': return <CheckCircle color="success" />;
            case 'error': return <Error color="error" />;
            case 'processing': return <HourglassEmpty color="warning" />;
            default: return <HourglassEmpty color="disabled" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ready': return 'success';
            case 'error': return 'error';
            case 'processing': return 'warning';
            default: return 'default';
        }
    };

    return (
        <Box>
            <Paper
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                sx={{
                    p: 4,
                    border: '2px dashed',
                    borderColor: dragOver ? 'primary.main' : 'grey.600',
                    bgcolor: dragOver ? 'action.hover' : 'rgba(255, 255, 255, 0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    borderRadius: 2,
                    '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'action.hover',
                    }
                }}
            >
                <Box
                    component="label"
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        cursor: 'pointer',
                    }}
                >
                    <input
                        type="file"
                        hidden
                        multiple
                        accept=".pdf,.docx,.txt,.md"
                        onChange={handleFileInput}
                    />
                    <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h6">Drop documents here</Typography>
                    <Typography color="text.secondary" variant="body2">
                        or click to browse
                    </Typography>
                    <Typography color="text.secondary" variant="caption" display="block" sx={{ mt: 1 }}>
                        Supports PDF, DOCX, TXT, Markdown
                    </Typography>
                </Box>
            </Paper>

            {uploading && <LinearProgress sx={{ mt: 2 }} />}

            {documents.length > 0 && (
                <List sx={{ mt: 2 }}>
                    {documents.map((doc) => (
                        <ListItem
                            key={doc.id}
                            secondaryAction={
                                <Chip
                                    size="small"
                                    label={doc.status}
                                    color={getStatusColor(doc.status) as any}
                                    icon={getStatusIcon(doc.status)}
                                />
                            }
                        >
                            <ListItemText
                                primary={doc.filename}
                                primaryTypographyProps={{ noWrap: true }}
                            />
                        </ListItem>
                    ))}
                </List>
            )}
        </Box>
    );
}
