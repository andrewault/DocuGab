import { useState } from 'react';
import {
    Box,
    Button,
    Typography,
    Alert,
    CircularProgress,
    Stack,
    Chip,
    IconButton,
} from '@mui/material';
import { Upload, Delete, Download, CheckCircle } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { getAuthHeader } from '../utils/authUtils';
import { formatInUserTimezone } from '../utils/timezoneUtils';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

interface Avatar {
    id: number;
    uuid: string;
    filename: string;
    original_filename: string;
    file_size: number;
    is_active: boolean;
    created_at: string;
    updated_at: string | null;
}

interface AvatarUploadProps {
    projectUuid: string;
    onUploadSuccess?: () => void;
}

export default function AvatarUpload({ projectUuid, onUploadSuccess }: AvatarUploadProps) {
    const { user } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [avatars, setAvatars] = useState<Avatar[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const fetchAvatars = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `${API_BASE}/api/customer/avatars/projects/${projectUuid}`,
                { headers: getAuthHeader() }
            );

            if (response.ok) {
                const data = await response.json();
                setAvatars(data.avatars || []);
            }
        } catch (err) {
            console.error('Failed to fetch avatars:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            validateAndSetFile(event.target.files[0]);
        }
    };

    const validateAndSetFile = (selectedFile: File) => {
        // Validate file extension
        if (!selectedFile.name.toLowerCase().endsWith('.gab')) {
            setError('Only .gab files are allowed');
            return;
        }

        // Validate file size (50MB)
        if (selectedFile.size > 50 * 1024 * 1024) {
            setError('File size must be less than 50MB');
            return;
        }

        setFile(selectedFile);
        setError(null);
        setSuccess(false);
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);

        if (event.dataTransfer.files && event.dataTransfer.files[0]) {
            validateAndSetFile(event.dataTransfer.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file');
            return;
        }

        try {
            setUploading(true);
            setError(null);

            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(
                `${API_BASE}/api/customer/avatars/projects/${projectUuid}/upload`,
                {
                    method: 'POST',
                    headers: {
                        ...getAuthHeader(),
                    },
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to upload avatar');
            }

            setSuccess(true);
            setFile(null);

            // Refresh avatar list
            await fetchAvatars();

            if (onUploadSuccess) {
                onUploadSuccess();
            }

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload avatar');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (avatarUuid: string) => {
        if (!confirm('Are you sure you want to delete this avatar?')) {
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE}/api/customer/avatars/${avatarUuid}`,
                {
                    method: 'DELETE',
                    headers: getAuthHeader(),
                }
            );

            if (!response.ok) {
                throw new Error('Failed to delete avatar');
            }

            // Refresh avatar list
            await fetchAvatars();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete avatar');
        }
    };

    const handleDownload = (avatarUuid: string, filename: string) => {
        const downloadUrl = `${API_BASE}/api/customer/avatars/${avatarUuid}/download`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        link.click();
    };

    // Load avatars on mount
    useState(() => {
        fetchAvatars();
    });

    return (
        <Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && (
                <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 2 }}>
                    Avatar uploaded successfully!
                </Alert>
            )}

            {/* Upload Section */}
            <Box
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                sx={{
                    border: '2px dashed',
                    borderColor: isDragging ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    p: 3,
                    mb: 3,
                    bgcolor: isDragging ? 'action.hover' : 'transparent',
                    transition: 'all 0.2s ease',
                }}
            >
                <Stack spacing={2}>
                    <input
                        accept=".gab"
                        style={{ display: 'none' }}
                        id="avatar-upload"
                        type="file"
                        onChange={handleFileChange}
                        disabled={uploading}
                    />
                    <label htmlFor="avatar-upload">
                        <Button
                            variant="outlined"
                            component="span"
                            startIcon={<Upload />}
                            disabled={uploading}
                            fullWidth
                        >
                            {file ? file.name : 'Choose GAB File'}
                        </Button>
                    </label>

                    {file && (
                        <Button
                            variant="contained"
                            onClick={handleUpload}
                            disabled={uploading}
                            fullWidth
                        >
                            {uploading ? (
                                <>
                                    <CircularProgress size={20} sx={{ mr: 1 }} />
                                    Uploading...
                                </>
                            ) : (
                                'Upload Avatar'
                            )}
                        </Button>
                    )}

                    <Typography variant="caption" color="text.secondary" textAlign="center">
                        {isDragging ? 'Drop file here' : 'Drag and drop a .gab file here, or click to browse'}
                        <br />
                        Max file size: 50MB
                    </Typography>
                </Stack>
            </Box>

            {/* Avatar List */}
            {loading ? (
                <Box display="flex" justifyContent="center" py={2}>
                    <CircularProgress size={24} />
                </Box>
            ) : avatars.length > 0 ? (
                <Stack spacing={1}>
                    <Typography variant="subtitle2" color="text.secondary">
                        Uploaded Avatars
                    </Typography>
                    {avatars.map((avatar) => (
                        <Box
                            key={avatar.uuid}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                p: 1.5,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                            }}
                        >
                            <Box flex={1}>
                                <Typography variant="body2" fontWeight={500}>
                                    {avatar.original_filename}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {(avatar.file_size / 1024).toFixed(1)} KB • {formatInUserTimezone(avatar.created_at, user?.timezone || 'UTC')}
                                </Typography>
                            </Box>
                            {avatar.is_active && (
                                <Chip label="Active" size="small" color="success" sx={{ mr: 1 }} />
                            )}
                            <Box>
                                <IconButton
                                    size="small"
                                    onClick={() => handleDownload(avatar.uuid, avatar.original_filename)}
                                    title="Download"
                                >
                                    <Download fontSize="small" />
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={() => handleDelete(avatar.uuid)}
                                    title="Delete"
                                    color="error"
                                >
                                    <Delete fontSize="small" />
                                </IconButton>
                            </Box>
                        </Box>
                    ))}
                </Stack>
            ) : (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                    An avatar has not been uploaded yet
                </Typography>
            )}
        </Box>
    );
}
