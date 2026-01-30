import { useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Button,
    Alert,
    CircularProgress,
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

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setFile(event.target.files[0]);
            setError(null);
            setSuccess(false);
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
            formData.append('file', file);
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
                        { label: 'Projects', path: `/customer/${customer_uuid}/projects` },
                        { label: 'Project', path: `/customer/${customer_uuid}/projects/${project_uuid}` },
                        { label: 'Upload Document' },
                    ]}
                />

                {/* Header */}
                <Box mb={4}>
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 700,
                            background: 'linear-gradient(90deg, #6366f1, #10b981)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 1,
                        }}
                    >
                        Upload Document
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Upload a document to this project for processing
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
                        <Box>
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
                                    {file ? file.name : 'Choose File'}
                                </Button>
                            </label>
                            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                                Supported formats: PDF, DOCX, TXT, MD
                            </Typography>
                        </Box>

                        {/* Upload Button */}
                        <Button
                            variant="contained"
                            onClick={handleUpload}
                            disabled={!file || uploading || success}
                            fullWidth
                            sx={{ py: 1.5 }}
                        >
                            {uploading ? (
                                <>
                                    <CircularProgress size={20} sx={{ mr: 1 }} />
                                    Uploading...
                                </>
                            ) : (
                                'Upload Document'
                            )}
                        </Button>

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
