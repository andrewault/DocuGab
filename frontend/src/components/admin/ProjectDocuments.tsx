import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Stack,
    Button,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Tooltip,
    Alert,
} from '@mui/material';
import { Description, CloudUpload, Delete } from '@mui/icons-material';
import { getAuthHeader } from '../../utils/authUtils';
import { formatInUserTimezone } from '../../utils/timezoneUtils';
import type { Project, Document } from '../../types/project';
import { API_BASE } from '@/config/api';

interface ProjectDocumentsProps {
    project: Project;
    documents: Document[];
    currentUser: { timezone?: string } | null;
    onRefresh: () => Promise<void>;
}

export function ProjectDocuments({ project, documents, currentUser, onRefresh }: ProjectDocumentsProps) {
    const navigate = useNavigate();
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
    const [documentsOrderBy, setDocumentsOrderBy] = useState<keyof Document>('original_filename');
    const [documentsOrder, setDocumentsOrder] = useState<'asc' | 'desc'>('asc');
    const [deleting, setDeleting] = useState(false);

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
                    `${API_BASE}/api/v1/documents/upload?project_id=${project.id}`,
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
            await onRefresh();
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

    const handleDeleteClick = (doc: Document) => {
        setDocumentToDelete(doc);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!documentToDelete) return;

        setDeleting(true);
        try {
            const response = await fetch(
                `${API_BASE}/api/v1/documents/${documentToDelete.uuid}`,
                {
                    method: 'DELETE',
                    headers: getAuthHeader(),
                }
            );

            if (!response.ok) {
                throw new Error('Failed to delete document');
            }

            // Refresh documents list
            await onRefresh();
            setDeleteDialogOpen(false);
            setDocumentToDelete(null);
        } catch (error) {
            console.error('Delete error:', error);
        } finally {
            setDeleting(false);
        }
    };

    const handleViewDocument = (doc: Document) => {
        // Navigate to the deep link URL as requested
        navigate(`/admin/projects/${project.uuid}/documents/${doc.uuid}`);
    };

    return (
        <>
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
                                    <TableCell>
                                        <TableSortLabel
                                            active={documentsOrderBy === 'original_filename'}
                                            direction={documentsOrderBy === 'original_filename' ? documentsOrder : 'asc'}
                                            onClick={() => {
                                                const isAsc = documentsOrderBy === 'original_filename' && documentsOrder === 'asc';
                                                setDocumentsOrder(isAsc ? 'desc' : 'asc');
                                                setDocumentsOrderBy('original_filename');
                                            }}
                                        >
                                            Filename
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={documentsOrderBy === 'file_size'}
                                            direction={documentsOrderBy === 'file_size' ? documentsOrder : 'asc'}
                                            onClick={() => {
                                                const isAsc = documentsOrderBy === 'file_size' && documentsOrder === 'asc';
                                                setDocumentsOrder(isAsc ? 'desc' : 'asc');
                                                setDocumentsOrderBy('file_size');
                                            }}
                                        >
                                            Size
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={documentsOrderBy === 'chunks_count'}
                                            direction={documentsOrderBy === 'chunks_count' ? documentsOrder : 'asc'}
                                            onClick={() => {
                                                const isAsc = documentsOrderBy === 'chunks_count' && documentsOrder === 'asc';
                                                setDocumentsOrder(isAsc ? 'desc' : 'asc');
                                                setDocumentsOrderBy('chunks_count');
                                            }}
                                        >
                                            Chunks
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={documentsOrderBy === 'created_at'}
                                            direction={documentsOrderBy === 'created_at' ? documentsOrder : 'asc'}
                                            onClick={() => {
                                                const isAsc = documentsOrderBy === 'created_at' && documentsOrder === 'asc';
                                                setDocumentsOrder(isAsc ? 'desc' : 'asc');
                                                setDocumentsOrderBy('created_at');
                                            }}
                                        >
                                            Uploaded
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {[...documents]
                                    .sort((a, b) => {
                                        const aVal = a[documentsOrderBy];
                                        const bVal = b[documentsOrderBy];
                                        if (aVal === null || aVal === undefined) return 1;
                                        if (bVal === null || bVal === undefined) return -1;
                                        if (typeof aVal === 'string' && typeof bVal === 'string') {
                                            return documentsOrder === 'asc'
                                                ? aVal.localeCompare(bVal)
                                                : bVal.localeCompare(aVal);
                                        }
                                        if (aVal < bVal) return documentsOrder === 'asc' ? -1 : 1;
                                        if (aVal > bVal) return documentsOrder === 'asc' ? 1 : -1;
                                        return 0;
                                    })
                                    .map((doc) => (
                                        <TableRow
                                            key={doc.id}
                                            hover
                                            onClick={() => handleViewDocument(doc)}
                                            sx={{ cursor: 'pointer' }}
                                        >
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
                                                    label={doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                                                    size="small"
                                                    color={
                                                        doc.status === 'processed' || doc.status === 'ready'
                                                            ? 'success'
                                                            : doc.status === 'processing'
                                                                ? 'info'
                                                                : doc.status === 'error'
                                                                    ? 'error'
                                                                    : 'default'
                                                    }
                                                    sx={
                                                        doc.status === 'ready'
                                                            ? { bgcolor: '#4caf50', color: 'white', fontWeight: 600 }
                                                            : {}
                                                    }
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
        </>
    );
}
