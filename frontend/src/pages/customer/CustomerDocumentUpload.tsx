import { useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Button,
    Alert,
    useTheme,
    Stack,
} from '@mui/material';
import { Upload, CheckCircle } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAuthHeader } from '../../utils/authUtils';
import CustomerBreadcrumbs from '../../components/CustomerBreadcrumbs';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

export default function CustomerDocumentUpload() {
    const { customer_uuid, project_uuid } = useParams<{ customer_uuid: string; project_uuid: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            validateAndSetFile(event.target.files[0]);
        }
    };

    const validateAndSetFile = (selectedFile: File) => {
        setFile(selectedFile);
        setError(null);
        setSuccess(false);
        // Auto-upload after file selection
        uploadFile(selectedFile);
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

    const uploadFile = async (fileToUpload: File) => {
        try {
            setUploading(true);
            setError(null);

            // First, get the project details to get the project ID
            const projectResponse = await fetch(
                `${API_BASE}/api/customer/projects/${project_uuid}`,
                { headers: getAuthHeader() }
            );

            if (!projectResponse.ok) {
                throw new Error('Failed to fetch project details');
            }

            const projectData = await projectResponse.json();

            // Upload the document
            const formData = new FormData();
            formData.append('file', fileToUpload);
            formData.append('project_id', projectData.id.toString());

            const uploadResponse = await fetch(`${API_BASE}/api/documents/upload`, {
                method: 'POST',
                headers: {
                    ...getAuthHeader(),
                },
                body: formData,
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(errorData.detail || 'Failed to upload document');
            }

            setSuccess(true);
            setFile(null);

            // Redirect back to project detail after 2 seconds
            setTimeout(() => {
                navigate(`/customer/${customer_uuid}/projects/${project_uuid}`);
            }, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload document');
        } finally {
            setUploading(false);
        }
    };

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
            <Container maxWidth="md" sx={{ px: 3 }}>
                {/* Breadcrumbs */}
                <CustomerBreadcrumbs
                    items={[
                        { label: 'Chatbot Projects', path: `/customer/${customer_uuid}/projects` },
                        { label: 'Chatbot Project', path: `/customer/${customer_uuid}/projects/${project_uuid}` },
                        { label: 'Upload Document' },
                    ]}
                />

                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                    <Upload sx={{ fontSize: 32, color: '#6366f1' }} />
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
                        Upload Document
                    </Typography>
                </Box>

                {/* Upload Form */}
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        borderRadius: 2,
                        bgcolor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'background.paper',
                    }}
                >
                    <Stack spacing={3}>
                        {error && <Alert severity="error">{error}</Alert>}
                        {success && (
                            <Alert severity="success" icon={<CheckCircle />}>
                                Document uploaded successfully! Redirecting...
                            </Alert>
                        )}

                        {/* File Input */}
                        <Box
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            sx={{
                                border: '2px dashed',
                                borderColor: isDragging ? 'primary.main' : 'divider',
                                borderRadius: 2,
                                p: 3,
                                bgcolor: isDragging ? 'action.hover' : 'transparent',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <input
                                accept=".pdf,.docx,.txt,.md"
                                style={{ display: 'none' }}
                                id="file-upload"
                                type="file"
                                onChange={handleFileChange}
                                disabled={uploading || success}
                            />
                            <label htmlFor="file-upload">
                                <Button
                                    variant="outlined"
                                    component="span"
                                    startIcon={<Upload />}
                                    fullWidth
                                    disabled={uploading || success}
                                    sx={{ py: 2 }}
                                >
                                    {uploading ? 'Uploading...' : file ? file.name : 'Choose File'}
                                </Button>
                            </label>
                            <Typography variant="caption" color="text.secondary" display="block" mt={1} textAlign="center">
                                {isDragging ? 'Drop file here' : 'Drag and drop a file here, or click to browse'}
                                <br />
                                Supported formats: PDF, DOCX, TXT, MD
                            </Typography>
                        </Box>

                        {/* Cancel Button */}
                        <Button
                            variant="outlined"
                            onClick={() => navigate(`/customer/${customer_uuid}/projects/${project_uuid}`)}
                            disabled={uploading}
                            fullWidth
                        >
                            Cancel
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}
