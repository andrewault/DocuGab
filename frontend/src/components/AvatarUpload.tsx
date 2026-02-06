import { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Typography,
    Alert,
    CircularProgress,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Chip,
} from '@mui/material';
import { Upload, CloudUpload, CheckCircle, Person } from '@mui/icons-material';
import { useAuth } from '../context/AuthProvider';
import { getAuthHeader } from '../utils/authUtils';
import { API_BASE } from '@/config/api';

interface Avatar {
    id: number;
    uuid: string;
    name: string;
    customer_id: number | null;
    file_path: string;
    file_extension: string;
    file_size: number;
    original_filename: string;
    thumbnail_url: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string | null;
}

interface AvatarSelectProps {
    selectedAvatarId: number | null;
    customerId?: number;
    onSelect: (avatarId: number | null) => void;
    disabled?: boolean;
}

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['.glb', '.fbx'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function AvatarSelect({ selectedAvatarId, customerId, onSelect, disabled }: AvatarSelectProps) {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [avatars, setAvatars] = useState<Avatar[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);

    const fetchAvatars = async () => {
        try {
            setLoading(true);
            setError(null);
            // Use admin endpoint when customerId is provided (from admin pages) or when user is admin
            const useAdminEndpoint = isAdmin || customerId !== undefined;
            const endpoint = useAdminEndpoint
                ? `${API_BASE}/api/v1/admin/avatars${customerId ? `?customer_id=${customerId}` : ''}`
                : `${API_BASE}/api/v1/customer/avatars/`;

            const response = await fetch(endpoint, { headers: getAuthHeader() });

            if (response.ok) {
                const data = await response.json();
                setAvatars(data.avatars || []);
            } else {
                setError('Failed to load avatars');
            }
        } catch (err) {
            console.error('Failed to fetch avatars:', err);
            setError('Failed to load avatars');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAvatars();
    }, [customerId]);

    const handleUploadSuccess = () => {
        fetchAvatars();
        setUploadModalOpen(false);
    };

    // Find default avatar
    const defaultAvatar = avatars.find(a => a.name === 'Default');
    const selectedAvatar = avatars.find(a => a.id === selectedAvatarId);

    return (
        <Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Stack direction="row" spacing={2} alignItems="center">
                <FormControl fullWidth disabled={disabled || loading}>
                    <InputLabel>Avatar</InputLabel>
                    <Select
                        value={selectedAvatarId ?? 'default'}
                        onChange={(e) => {
                            const val = e.target.value;
                            onSelect(val === 'default' ? null : Number(val));
                        }}
                        label="Avatar"
                        renderValue={(value) => {
                            if (value === 'default') {
                                return defaultAvatar ? `${defaultAvatar.name} (Global)` : 'Default';
                            }
                            const avatar = avatars.find(a => a.id === Number(value));
                            return avatar ? avatar.name : 'Select Avatar';
                        }}
                    >
                        {/* Default avatar option (null means use default) */}
                        {defaultAvatar && (
                            <MenuItem value="default">
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Person fontSize="small" />
                                    <span>{defaultAvatar.name} (Global)</span>
                                </Stack>
                            </MenuItem>
                        )}

                        {/* Customer avatars */}
                        {avatars
                            .filter(a => a.name !== 'Default')
                            .map((avatar) => (
                                <MenuItem key={avatar.id} value={avatar.id}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Person fontSize="small" />
                                        <span>{avatar.name}</span>
                                        <Chip
                                            label={avatar.file_extension.toUpperCase()}
                                            size="small"
                                            variant="outlined"
                                            sx={{ ml: 1 }}
                                        />
                                    </Stack>
                                </MenuItem>
                            ))}
                    </Select>
                </FormControl>

                <Button
                    variant="outlined"
                    startIcon={<Upload />}
                    onClick={() => setUploadModalOpen(true)}
                    disabled={disabled}
                    sx={{ minWidth: 140, height: 56 }}
                >
                    Upload
                </Button>
            </Stack>

            {selectedAvatar && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Current: {selectedAvatar.original_filename} ({(selectedAvatar.file_size / 1024 / 1024).toFixed(2)} MB)
                </Typography>
            )}

            {/* Upload Modal */}
            <AvatarUploadModal
                open={uploadModalOpen}
                onClose={() => setUploadModalOpen(false)}
                onSuccess={handleUploadSuccess}
                customerId={customerId}
                isAdmin={isAdmin}
            />
        </Box>
    );
}


interface AvatarUploadModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    customerId?: number;
    isAdmin: boolean;
}

function AvatarUploadModal({ open, onClose, onSuccess, customerId, isAdmin }: AvatarUploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [name, setName] = useState('');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const resetForm = () => {
        setFile(null);
        setName('');
        setError(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const validateFile = (selectedFile: File): boolean => {
        const ext = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));

        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            setError(`Only ${ALLOWED_EXTENSIONS.join(', ')} files are allowed`);
            return false;
        }

        if (selectedFile.size > MAX_FILE_SIZE) {
            setError(`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`);
            return false;
        }

        return true;
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const selectedFile = event.target.files[0];
            if (validateFile(selectedFile)) {
                setFile(selectedFile);
                setError(null);
                // Auto-generate name from filename if not set
                if (!name) {
                    const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
                    setName(baseName);
                }
            }
        }
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
            const selectedFile = event.dataTransfer.files[0];
            if (validateFile(selectedFile)) {
                setFile(selectedFile);
                setError(null);
                if (!name) {
                    const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
                    setName(baseName);
                }
            }
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file');
            return;
        }
        if (!name.trim()) {
            setError('Please enter a name for the avatar');
            return;
        }

        try {
            setUploading(true);
            setError(null);

            const formData = new FormData();
            formData.append('file', file);

            const endpoint = isAdmin
                ? `${API_BASE}/api/v1/admin/avatars/upload?name=${encodeURIComponent(name)}${customerId ? `&customer_id=${customerId}` : ''}`
                : `${API_BASE}/api/customer/avatars/upload?name=${encodeURIComponent(name)}`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: getAuthHeader(),
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to upload avatar');
            }

            onSuccess();
            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload avatar');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Upload Avatar</DialogTitle>
            <DialogContent>
                <Stack spacing={3} sx={{ mt: 1 }}>
                    {error && (
                        <Alert severity="error" onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    <TextField
                        label="Avatar Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth
                        disabled={uploading}
                        helperText="A display name for this avatar"
                    />

                    {/* Drag & Drop Zone */}
                    <Box
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        sx={{
                            border: '2px dashed',
                            borderColor: isDragging ? 'primary.main' : 'divider',
                            borderRadius: 2,
                            p: 4,
                            bgcolor: isDragging ? 'action.hover' : 'transparent',
                            transition: 'all 0.2s ease',
                            textAlign: 'center',
                        }}
                    >
                        <input
                            accept=".glb,.fbx"
                            style={{ display: 'none' }}
                            id="avatar-file-upload"
                            type="file"
                            onChange={handleFileChange}
                            disabled={uploading}
                        />
                        <label htmlFor="avatar-file-upload">
                            <Stack spacing={2} alignItems="center">
                                <CloudUpload sx={{ fontSize: 48, color: 'text.secondary' }} />
                                <Button
                                    variant="outlined"
                                    component="span"
                                    disabled={uploading}
                                >
                                    {file ? file.name : 'Choose File'}
                                </Button>
                                <Typography variant="caption" color="text.secondary">
                                    {isDragging
                                        ? 'Drop file here'
                                        : 'Drag and drop a .glb or .fbx file, or click to browse'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Max file size: 50MB
                                </Typography>
                            </Stack>
                        </label>
                    </Box>

                    {file && (
                        <Alert severity="info" icon={<CheckCircle />}>
                            Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </Alert>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={uploading}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleUpload}
                    disabled={uploading || !file || !name.trim()}
                    startIcon={uploading ? <CircularProgress size={16} /> : <Upload />}
                >
                    {uploading ? 'Uploading...' : 'Upload'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
