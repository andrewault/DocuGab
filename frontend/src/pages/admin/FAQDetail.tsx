import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Paper,
    Button,
    Stack,
    Chip,
    Divider,
    useTheme,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { Edit, Delete, QuestionAnswer } from '@mui/icons-material';
import { getAuthHeader } from '../../utils/authUtils';
import AdminBreadcrumbs from '../../components/AdminBreadcrumbs';
import { useAuth } from '../../context/AuthProvider';
import { formatInUserTimezone } from '../../utils/timezoneUtils';

interface FAQItem {
    id: number;
    uuid: string;
    question: string;
    answer: string;
    order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8007';

export default function FAQDetail() {
    const { uuid } = useParams<{ uuid: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [faq, setFaq] = useState<FAQItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    useEffect(() => {
        const fetchFaq = async () => {
            if (!uuid) return;

            try {
                setLoading(true);
                const res = await fetch(`${API_BASE}/api/v1/faq/${uuid}`, {
                    headers: getAuthHeader(),
                });

                if (!res.ok) {
                    throw new Error('Failed to fetch FAQ');
                }

                const data = await res.json();
                setFaq(data);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to load FAQ');
            } finally {
                setLoading(false);
            }
        };

        fetchFaq();
    }, [uuid]);

    const handleDelete = async () => {
        if (!uuid) return;

        try {
            const res = await fetch(`${API_BASE}/api/v1/faq/${uuid}`, {
                method: 'DELETE',
                headers: getAuthHeader(),
            });

            if (res.ok) {
                navigate('/admin/faq');
            } else {
                throw new Error('Failed to delete FAQ');
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to delete FAQ');
        } finally {
            setDeleteDialogOpen(false);
        }
    };

    if (loading) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: isDark
                        ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
                        : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (error || !faq) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    py: 4,
                    background: isDark
                        ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
                        : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
                }}
            >
                <Container maxWidth={false} sx={{ px: 3 }}>
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error || 'FAQ not found'}
                    </Alert>
                </Container>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                py: 4,
                background: isDark
                    ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
                    : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
            }}
        >
            <Container maxWidth={false} sx={{ px: 3 }}>
                <AdminBreadcrumbs
                    items={[
                        { label: 'FAQs', path: '/admin/faq' },
                        { label: faq.question.substring(0, 50) + (faq.question.length > 50 ? '...' : '') },
                    ]}
                />

                {/* Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <QuestionAnswer sx={{ fontSize: 32, color: '#6366f1' }} />
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
                            FAQ Details
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="contained"
                            startIcon={<Edit />}
                            onClick={() => navigate(`/admin/faq/${uuid}/edit`)}
                        >
                            Edit
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<Delete />}
                            onClick={() => setDeleteDialogOpen(true)}
                        >
                            Delete
                        </Button>
                    </Stack>
                </Stack>

                {/* FAQ Content */}
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        borderRadius: 2,
                        bgcolor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'background.paper',
                    }}
                >
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                Question
                            </Typography>
                            <Typography variant="h5" fontWeight={600} sx={{ mt: 1 }}>
                                {faq.question}
                            </Typography>
                        </Box>

                        <Divider />

                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                Answer
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                                {faq.answer}
                            </Typography>
                        </Box>

                        <Divider />

                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                Status
                            </Typography>
                            <Box sx={{ mt: 0.5 }}>
                                <Chip
                                    label={faq.is_active ? 'Active' : 'Inactive'}
                                    color={faq.is_active ? 'success' : 'default'}
                                    size="small"
                                />
                            </Box>
                        </Box>

                        <Divider />

                        <Stack direction="row" spacing={4}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Created
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                    {formatInUserTimezone(
                                        faq.created_at,
                                        currentUser?.timezone || 'UTC'
                                    )}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Last Updated
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                    {formatInUserTimezone(
                                        faq.updated_at,
                                        currentUser?.timezone || 'UTC'
                                    )}
                                </Typography>
                            </Box>
                        </Stack>
                    </Stack>
                </Paper>

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                    <DialogTitle>Delete FAQ?</DialogTitle>
                    <DialogContent>
                        Are you sure you want to delete this FAQ? This action cannot be undone.
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleDelete} color="error" variant="contained">
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box >
    );
}
